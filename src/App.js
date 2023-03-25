import React, { useState, useEffect } from "react";
import "./App.css";
import TransferChart from "./components/TransferChart";
import BaseFeeVsGasUtilizationChart from "./components/BaseFeeVsGasUtilizationChart";
import { Network, Alchemy } from "alchemy-sdk";
import { ethers } from "ethers";

const erc20Address = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
//"0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844";
const ALCHEMY_API_KEY = '';
const settings = {
  apiKey: ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};
const contractABI = [
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  'function decimals() external view returns (uint8)',
];
const alchemy = new Alchemy(settings);


function App() {
  const [tokenName, setTokenName] = useState();
  const [contract, setContract] = useState();

  useEffect(() => {
    const getContractName = async () => {
      const contract = new ethers.Contract(erc20Address, contractABI, await alchemy.config.getProvider());
      setContract(contract);
      const name = await contract.name();
      console.log("Token Name : ", name);
      setTokenName(name);
    };

    getContractName();
    
  }, []);

  return (
    <>
      {<h1>ERC20 Token - ({tokenName}) </h1>}
      <TransferChart erc20Address={erc20Address} alchemy={alchemy} contractABI={contractABI} /> 
      <BaseFeeVsGasUtilizationChart
        erc20Address={erc20Address}
        alchemy={alchemy}
      />
    </>
  );
}

export default App;
