import React, { useState, useEffect } from "react";
import "./App.css";
import TransferChart from "./components/TransferChart";
import BaseFeeVsGasUtilizationChart from "./components/BaseFeeVsGasUtilizationChart";
import { Network, Alchemy } from "alchemy-sdk";
import { ethers } from "ethers";

const erc20Address = "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844";
const settings = {
  apiKey: "",
  network: Network.ETH_GOERLI,
};
const contractABI = [
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
];
const alchemy = new Alchemy(settings);

function App() {
  const [tokenName, setTokenName] = useState();
  // Create an instance of the ERC20 contract

  useEffect(() => {
    const getContractName = async () => {
      const contract = new ethers.Contract(erc20Address, contractABI, provider);
      const name = await contract.name();
      console.log("Token Name : ", name);
      return name;
    };
    const provider = new ethers.WebSocketProvider(
      "wss://eth-goerli.g.alchemy.com/v2/"
    );
    getContractName().then((name) => {
      setTokenName(name);
    });
    
  }, []);

  return (
    <>
      {<h1>ERC20 Token - ({tokenName}) </h1>}
      <TransferChart erc20Address={erc20Address} alchemy={alchemy} />
      <BaseFeeVsGasUtilizationChart
        erc20Address={erc20Address}
        alchemy={alchemy}
      />
    </>
  );
}

export default App;
