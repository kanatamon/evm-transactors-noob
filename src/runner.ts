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
  const jobsCount = sybils.length * sybilsConfig.jobs.length;
  runningProgressBar.start(jobsCount, 0);

  const bulk = sybils.map(async ({ pk, id: sybilId }) => {
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
        // @ts-ignore
        return transactors[job.name](pk, ...job.args);
      });
    return Promise.allSettled(jobPromises).then(async (results) => {
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const activityName = sybilsConfig.jobs[i].name;
        if (result.status === 'fulfilled') {
          await prismaClient.activity.create({
            data: {
              sybilId,
              status: 'SUCCESS',
              name: activityName,
              timestamp: new Date(),
              log: JSON.stringify(result.value),
            },
          });
          metrics.success++;
        }
        if (result.status === 'rejected') {
          await prismaClient.activity.create({
            data: {
              sybilId,
              status: 'FAILED',
              name: activityName,
              timestamp: new Date(),
              log: JSON.stringify(result.reason),
            },
          });
          metrics.failed++;
        }
        runningProgressBar.increment();
      }
    });
  });

  await Promise.allSettled(bulk);
  runningProgressBar.stop();
}

main()
  .then(() => {
    console.log(`✅ Success: \x1b[32m${metrics.success}\x1b[0m`);
    console.log(`❌ Failed: \x1b[31m${metrics.failed}\x1b[0m`);
  })
  .finally(() => {
    prismaClient.$disconnect();
  });
