import { ethers } from 'ethers';

export function toDoubleNumber(n: bigint) {
  return Math.ceil(Number(ethers.formatEther(n)) * 2);
}
