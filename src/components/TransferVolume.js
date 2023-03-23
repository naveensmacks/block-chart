import React, { useState, useEffect } from 'react';
import { AlchemyProvider } from '@ethersproject/providers';
import { ethers } from 'ethers';

const ALCHEMY_API_KEY = '';
const ERC20_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
//'0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844';
const TRANSFER_EVENT_SIGNATURE = 'Transfer(address,address,uint256)';

const provider = new AlchemyProvider('mainnet', ALCHEMY_API_KEY);

const TransferVolume = () => {
  const [totalTransferVolume, setTotalTransferVolume] = useState(null);

  useEffect(() => {
    const getTotalTransferVolume = async () => {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = currentBlock - 9;

      const erc20ABI = [
        // Other ABI entries can be placed here, but we only need Transfer event for this example
        'event Transfer(address indexed from, address indexed to, uint256 value)',
         // decimals function
        'function decimals() external view returns (uint8)',
      ];

      const contract = new ethers.Contract(ERC20_CONTRACT_ADDRESS, erc20ABI, provider);

      const filter = contract.filters.Transfer();
      filter.fromBlock = fromBlock;
      filter.toBlock = currentBlock;

      const logs = await provider.getLogs(filter);
      console.log('logs:', logs);

      const eventInterface = new ethers.utils.Interface(erc20ABI);
      let calculatedTotalTransferVolume = ethers.BigNumber.from(0);

      logs.forEach((log) => {
        const decodedLog = eventInterface.parseLog(log);
        console.log("decodedLog : ",decodedLog);
        const transferValue = decodedLog.args.value;
        calculatedTotalTransferVolume = calculatedTotalTransferVolume.add(transferValue);
      });
      console.log("Wasted : ",calculatedTotalTransferVolume);
      const decimals = await contract.decimals();
      console.log("decimals : ",decimals);
      console.log("actual : ",ethers.utils.formatUnits(calculatedTotalTransferVolume.toString(),decimals));
      setTotalTransferVolume(ethers.utils.formatUnits(calculatedTotalTransferVolume.toString(),decimals));
    };

    getTotalTransferVolume().catch(console.error);
  }, []);

  return (
    <div>
      <h3>Total Transfer Volume (last 10 blocks):</h3>
      {totalTransferVolume === null ? <p>Loading...</p> : <p>{totalTransferVolume} tokens</p>}
    </div>
  );
};

export default TransferVolume;
