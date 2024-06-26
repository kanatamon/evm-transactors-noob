import { ethers } from 'ethers';
import cEthAbi from './voteOnRubyscore.abi';
import { availableRpc, toDoubleNumber } from '../utils';

const RPC_URLS = [`https://rpc.mainnet.taiko.xyz`];

const CONTRACT_ADDRESS = '0x4D1E2145082d0AB0fDa4a973dC4887C7295e21aB';

export async function voteOnRubyscore(privateKey: string) {
  const provider = await availableRpc(RPC_URLS);
  const wallet = new ethers.Wallet(privateKey, provider);
  const cEthContract = new ethers.Contract(CONTRACT_ADDRESS, cEthAbi, wallet);

  const amountInWei = ethers.parseEther('0');

  const estimatedGas = await cEthContract.vote.estimateGas({
    value: amountInWei,
  });
  const tx = await cEthContract.vote({
    value: amountInWei,
    gasLimit: toDoubleNumber(estimatedGas),
  });
  const receipt = await tx.wait();
  return receipt;
}
