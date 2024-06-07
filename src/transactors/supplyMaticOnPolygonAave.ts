import { ethers } from 'ethers';
import cEthAbi from './supplyMaticOnPolygonAave.abi';
import { toDoubleNumber } from '../utils';

const RPC_URL = `https://polygon-rpc.com`;

// https://docs.aave.com/developers/deployed-contracts/v3-mainnet/polygon
const CONTRACT_ADDRESS = '0xC1E320966c485ebF2A0A2A6d3c0Dc860A156eB1B';
// cWETHv3 contract address on Base
const POOL_ADDRESS = '0x794a61358D6845594F94dc1DB02A252b5b4814aD';

export async function supplyMaticOnAave(privateKey: string, amount: string) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  const cEthContract = new ethers.Contract(CONTRACT_ADDRESS, cEthAbi, wallet);

  const amountInWei = ethers.parseEther(amount);
  const args = [POOL_ADDRESS, wallet.address, 0];

  // console.log(`Supplying MATIC on AAVE`);
  // console.log(`Address: ${wallet.address}`);
  // console.log('Amount:', amountInWei.toString());
  const estimatedGas = await cEthContract.depositETH.estimateGas(...args, {
    value: amountInWei,
  });
  const tx = await cEthContract.depositETH(...args, {
    value: amountInWei,
    gasLimit: toDoubleNumber(estimatedGas),
  });
  // console.log('Transaction sent:', tx.hash);
  // console.log('Transaction sent:', tx.hash);
  // console.log('Waiting for transaction to be mined...');
  const receipt = await tx.wait();
  // console.log('Transaction mined:', receipt);
  // console.log(`---------------------------------`);
  return receipt;
}
