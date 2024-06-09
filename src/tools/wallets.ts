import { ethers } from 'ethers';
import invariant from 'tiny-invariant';

const phrase = process.argv[2]; // Read the phrase from command line arguments
const countRaw = process.argv[3]; // Read the phrase from command line arguments

const count = parseInt(countRaw, 10);

invariant(phrase, 'Please provide a phrase as a command line argument');
invariant(
  !Number.isNaN(count),
  'Please provide a count as a command line argument'
);

const wallets = [];

for (let i = 0; i < count; i++) {
  const wallet = ethers.HDNodeWallet.fromPhrase(
    phrase,
    undefined,
    `m/44'/60'/0'/0/${i}`
  );
  wallets.push([wallet.privateKey, wallet.address]);
}

console.log(`---------------------------------`);
console.log(`|          Private Key          |`);
console.log(`---------------------------------`);

wallets.forEach(([privateKey, address]) => {
  console.log(privateKey);
});

console.log(`---------------------------------`);
console.log(`|            Address             |`);
console.log(`---------------------------------`);

wallets.forEach(([privateKey, address]) => {
  console.log(address);
});
