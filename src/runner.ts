import { PrismaClient } from '@prisma/client';
import invariant from 'tiny-invariant';
import sybilsConfig from '../sybils.config';
import * as transactors from './transactors';

const prismaClient = new PrismaClient();

invariant(
  sybilsConfig.jobs.every((job) => job.name in transactors),
  `Invalid job name in sybils.config.ts. Available job names are: [${Object.keys(
    transactors
  ).join(', ')}]`
);

async function main() {
  const sybils = await prismaClient.sybil.findMany({
    where: {
      groupName: {
        in: sybilsConfig.storage.sheetNames,
      },
    },
    take: 3,
  });
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
    return Promise.allSettled(jobPromises).then((results) => {
      results.forEach(async (result, i) => {
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
        }
      });
    });
  });

  await Promise.allSettled(bulk);
}

main()
  .then(() => {
    console.log('All jobs are done.');
  })
  .finally(() => {
    prismaClient.$disconnect();
  });
