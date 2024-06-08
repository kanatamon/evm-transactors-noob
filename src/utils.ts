import { ethers } from 'ethers';

export function toDoubleNumber(n: bigint) {
  return n * BigInt(2);
}

// TODO: use better solution to check if the provider is working
export async function availableRpc(urls: string[]) {
  for (const url of urls) {
    try {
      const provider = new ethers.JsonRpcProvider(url);
      await provider.getBlockNumber(); // Test if the provider is working
      return provider;
    } catch (error) {
      if (error instanceof Error) {
        console.warn(`Provider ${url} failed: ${error.message}`);
      }
    }
  }
  throw new Error('No working providers found');
}
