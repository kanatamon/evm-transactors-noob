import cliProgress from 'cli-progress';
import { PrismaClient } from '@prisma/client';
import invariant from 'tiny-invariant';
import sybilsConfig from '../sybils.config';
import * as transactors from './transactors';

invariant(
  sybilsConfig.jobs.every((job) => job.name in transactors),
  `Invalid job name in sybils.config.ts. Available job names are: [${Object.keys(
    transactors
  ).join(', ')}]`
);

const prismaClient = new PrismaClient();

// create a new progress bar instance and use shades_classic theme
const runningProgressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

const metrics = {
  success: 0,
  failed: 0,
};

async function main() {
  const sybils = await prismaClient.sybil.findMany({
    where: {
      groupName: {
        in: sybilsConfig.storage.sheetNames,
      },
    },
  });

  const jobsBulkPromises = sybils.map(async ({ pk, id: sybilId }) => {
    /**
     * Problem: Array.filter() do not work with async functions.
     * Solution: Use Promise.all() with Array.map() to run async functions in parallel.
     * Ref: https://medium.com/@debbs119/array-filter-and-array-map-with-async-functions-9636e1ae8d6e
     */
    const toRunJobs = await Promise.all(
      sybilsConfig.jobs.map(async (job) => {
        const latestActivity = await prismaClient.activity.findFirst({
          where: {
            sybilId,
            name: job.name,
          },
          orderBy: {
            timestamp: 'desc',
          },
        });
        return !latestActivity || latestActivity.status === 'FAILED';
      })
    );
    const jobPromises = sybilsConfig.jobs
      .filter((_, i) => toRunJobs[i])
      .map((job) => {
        return {
          sybilId,
          jobName: job.name,
          // @ts-ignore
          txn: () => transactors[job.name](pk, ...job.args),
        };
      });

    return jobPromises;
  });
  const jobsBulk = await Promise.all(jobsBulkPromises);
  const jobs = jobsBulk.flat();

  if (jobs.length === 0) {
    return console.log('No jobs to run');
  }
  runningProgressBar.start(jobs.length, 0);

  type Txn =
    | {
        status: 'success';
        receipt: any;
        sybilId: number;
        jobName: string;
      }
    | {
        status: 'failed';
        error: any;
        sybilId: number;
        jobName: string;
      };
  const txns: Txn[] = [];

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const identifier = {
      sybilId: job.sybilId,
      jobName: job.jobName,
    };
    try {
      const receipt = await job.txn();
      txns.push({
        status: 'success',
        receipt,
        ...identifier,
      });
    } catch (error) {
      txns.push({
        status: 'failed',
        error,
        ...identifier,
      });
    } finally {
      runningProgressBar.increment();
    }
  }

  const results = await Promise.all(txns);
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'success') {
      await prismaClient.activity.create({
        data: {
          sybilId: result.sybilId,
          status: 'SUCCESS',
          name: result.jobName,
          timestamp: new Date(),
          log: JSON.stringify(result.receipt),
        },
      });
      metrics.success++;
    }
    if (result.status === 'failed') {
      await prismaClient.activity.create({
        data: {
          sybilId: result.sybilId,
          status: 'FAILED',
          name: result.jobName,
          timestamp: new Date(),
          log: JSON.stringify(result.error),
        },
      });
      metrics.failed++;
    }
  }

  runningProgressBar.stop();
  console.log(`✅ Success: \x1b[32m${metrics.success}\x1b[0m`);
  console.log(`❌ Failed: \x1b[31m${metrics.failed}\x1b[0m`);
}

main().finally(() => {
  prismaClient.$disconnect();
});
