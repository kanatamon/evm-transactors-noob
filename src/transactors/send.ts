import { ethers } from 'ethers';

// Get the list of RPC URLs from the environment variable
const rpcUrls = [`https://mainnet.base.org`];
const PRIVATE_KEY = `PRIVATE_KEY`;

const addressTo = '0xdc34d0b259bc477351da1c1e64fdd7f4123b33d3'; // Replace with the recipient's address

// Set up a function to find a working provider
async function findWorkingProvider(urls: string[]) {
  for (const url of urls) {
    try {
      const provider = new ethers.JsonRpcProvider(url);
      await provider.getBlockNumber(); // Test if the provider is working
      console.log(`Using provider: ${url}`);
      return provider;
    } catch (error) {
      if (error instanceof Error) {
        console.warn(`Provider ${url} failed: ${error.message}`);
      }
    }
  }
  throw new Error('No working providers found');
}

async function sendTransaction() {
  try {
    // Find a working provider
    const provider = await findWorkingProvider(rpcUrls);

    // Set up wallet
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(
      `Attempting to send transaction from ${wallet.address} to ${addressTo}`
    );

    // Define the recipient and amount to transfer
    const amountInEther = '0.000000000001'; // Amount of ETH to send

    const tx = {
      to: addressTo,
      // value: ethers.utils.parseEther(amountInEther),
      value: ethers.parseEther(amountInEther),
    };
    const estimatedGas = await wallet.estimateGas(tx);
    console.log('Estimated gas:', ethers.formatEther(estimatedGas));

    // Send the transaction
    const txResponse = await wallet.sendTransaction(tx);
    console.log('Transaction sent:', txResponse.hash);

    // Wait for the transaction to be mined
    const receipt = await txResponse.wait();
    console.log('Transaction mined:', receipt);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    }
  }
}

sendTransaction();
