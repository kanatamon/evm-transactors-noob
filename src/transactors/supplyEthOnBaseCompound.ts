import { ethers } from 'ethers';
import cEthAbi from './supplyEthOnBaseCompound.abi';
import { availableRpc, toDoubleNumber } from '../utils';

const RPC_URLS = [
  `https://mainnet.base.org`,
  `https://base-rpc.publicnode.com`,
  `https://base.meowrpc.com`,
  `https://base-pokt.nodies.app`,
  `https://base.drpc.org`,
  `https://base.llamarpc.com`,
];

// https://docs.compound.finance/#protocol-contracts
const CONTRACT_ADDRESS = '0x78D0677032A35c63D142a48A2037048871212a8C';
// cWETHv3 contract address on Base
const COMET_ADDRESS = '0x46e6b214b524310239732D51387075E0e70970bf';

export async function supplyEthOnCompound(privateKey: string, amount: string) {
  // const provider = new ethers.JsonRpcProvider(RPC_URL);
  const provider = await availableRpc(RPC_URLS);
  const wallet = new ethers.Wallet(privateKey, provider);
  const cEthContract = new ethers.Contract(CONTRACT_ADDRESS, cEthAbi, wallet);

  const amountInWei = ethers.parseEther(amount);

  const supplyAssetCalldata = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'address', 'uint'],
    [COMET_ADDRESS, wallet.address, amountInWei]
  );
  const actionCalldata = await cEthContract.ACTION_SUPPLY_NATIVE_TOKEN();

  const args = [[actionCalldata], [supplyAssetCalldata]];

  // console.log(`Supplying ETH on Compound`);
  // console.log(`Address: ${wallet.address}`);
  // console.log('Amount:', amountInWei.toString());
  const estimatedGas = await cEthContract.invoke.estimateGas(...args, {
    value: amountInWei,
  });
  // console.log('Estimated gas:', estimatedGas.toString());
  // console.log(`Double gas limit: ${toDoubleNumber(estimatedGas)}`);
  const tx = await cEthContract.invoke(...args, {
    value: amountInWei,
    gasLimit: toDoubleNumber(estimatedGas),
  });
  // console.log('Transaction sent:', tx.hash);
  // console.log('Waiting for transaction to be mined...');
  const receipt = await tx.wait();
  // console.log('Transaction mined:', receipt);
  // console.log(`---------------------------------`);
  return receipt;
}
