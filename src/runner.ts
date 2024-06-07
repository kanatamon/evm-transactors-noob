import invariant from 'tiny-invariant';
import sybilsConfig from '../sybils.config';
import * as transactors from './transactors';

const pks = ['0x123', '0x456', '0x789'];

invariant(
  sybilsConfig.jobs.every((job) => job.name in transactors),
  `Invalid job name in sybils.config.ts. Available job names are: [${Object.keys(
    transactors
  ).join(', ')}]`
);

async function main() {
  const bulk = pks.map(async (pk) => {
    const jobPromises = sybilsConfig.jobs.map(async (job) => {
      // @ts-ignore
      return transactors[job.name](pk, ...job.args);
    });
    return Promise.allSettled(jobPromises).then((results) => {
      results.forEach((result, i) => {
        // TODO: Update .xlsx file
        if (result.status === 'fulfilled') {
          console.log(
            `Job ${sybilsConfig.jobs[i].name} succeeded`,
            result.value
          );
        } else {
          console.log(`Job ${sybilsConfig.jobs[i].name} failed`, result.reason);
        }
      });
    });
  });
  await Promise.allSettled(bulk);
  console.log('All jobs completed');
}

main();
