import invariant from 'tiny-invariant';
import cliProgress from 'cli-progress';
import { voteOnRubyscore } from '../transactors/voteOnRubyscore';

const runningProgressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic
);

const pk = process.argv[2]; // Read the phrase from command line arguments
const txMaxCount = process.argv[3]; // Read the phrase from command line arguments

const count = parseInt(txMaxCount, 10);

invariant(pk, 'Please provide a private-key as a command line argument');
invariant(
  !Number.isNaN(count),
  'Please provide a count as a command line argument'
);

(async () => {
  runningProgressBar.start(count, 0);
  let numOfSuccess = 0;

  for (let i = 0; i < count; i++) {
    await voteOnRubyscore(pk).then(() => {
      numOfSuccess++;
    });
    runningProgressBar.increment();
  }

  runningProgressBar.stop();

  console.log(`---------------------------------`);
  console.log(`✅ Success: \x1b[32m${numOfSuccess}\x1b[0m`);
  console.log(`❌ Failed: \x1b[31m${count - numOfSuccess}\x1b[0m`);
})();
