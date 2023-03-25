import React, { useState, useEffect, useCallback } from "react";
import { Line } from "react-chartjs-2";
// eslint-disable-next-line no-unused-vars
import { Chart } from "chart.js/auto";
import { Card } from "react-bootstrap";
import { ethers, utils, BigNumber } from "ethers";

const TransferChart = ({ erc20Address, alchemy, contractABI }) => {
  const [chartData, setChartData] = useState([]);
  const [chartOptions, setChartOptions] = useState([]);
  const [socket, setSocket] = useState(null);

  function getTotalVolumeTransfer(logs) {
    let totalVolume = BigNumber.from(0);
  
    for (const log of logs) {
      const transferAmount = BigNumber.from(log.data);
      totalVolume = totalVolume.add(transferAmount);
    }
  
    return totalVolume;
  }

  const transformLogs = async(blockNumber) =>{
    let transferData = {};
    let promises = []; 
    const contract = new ethers.Contract(erc20Address, contractABI, await alchemy.config.getProvider());
    const decimals = await contract.decimals();
    console.log("contract decimals : ", decimals);
    for(let i =0; i< 10; i++){
      let promise = alchemy.core.getLogs({
          address: erc20Address,
          topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",],
          fromBlock: utils.hexValue(blockNumber - i),
          toBlock: utils.hexValue(blockNumber - i),
        }).then((logs) => {
          console.log("blockNumber: ",blockNumber - i);
          console.log("Transfer logs:", logs);
          const totalVolume = getTotalVolumeTransfer(logs);
          console.log("Total volume transfer in latest block:",totalVolume.toString());
          transferData[blockNumber - i] = parseFloat(utils.formatUnits(totalVolume,decimals));
        }).catch((error) => {
          console.log(error);
        });
        promises.push(promise);
    }
    await Promise.all(promises);
    return transferData;
  };
  const getTransferData = async () => {
    try {
      let blockNumber = await alchemy.core.getBlockNumber();
      console.log("Latest Block Number : ", blockNumber);

      let transferData = await transformLogs(blockNumber);
      console.log("TransferData after await transformLogs(): ", transferData);
      const cd = {
        labels: Object.keys(transferData), // array of block numbers
        datasets: [
          {
            label: "Total Transfer Volume",
            data: Object.values(transferData), // array of transfer volumes
            fill: false,
            backgroundColor: "rgba(75,192,192,0.4)",
            borderColor: "rgba(75,192,192,1)",
          },
        ],
      };

      console.log("chartData :", cd);
      const cp = {
        scales: {
          x: {
            title: {
              display: true,
              text: "Block Numbers (last 10)",
              color: "black",
              font: {
                size: 15,
                weight: "bold",
              }
            },
          },
          y: {
            title: {
              display: true,
              text: "Total Transfer Volume (in WEI)",
              color: "black",
              font: {
                size: 15,
                weight: "bold",
              }
            },
            ticks: {
              beginAtZero: true,
            },
          },
        },
      };

      console.log("chartOptions :", cp);

      setChartData(cd);
      setChartOptions(cp);
    } catch (error) {
      console.error("N-ERROR. : ", error);
    }
  };

  const addNewBlock = async (blockNumber) => {
    
    let logs = await alchemy.core.getLogs({
      address: erc20Address,
      topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
      fromBlock: utils.hexValue(blockNumber),
      toBlock: utils.hexValue(blockNumber),
    });

    console.log("Transfer logs:", logs);
    const totalVolume = getTotalVolumeTransfer(logs);
    console.log("Total volume transfer in latest block:", totalVolume.toString());
    
    const contract = new ethers.Contract(erc20Address, contractABI, await alchemy.config.getProvider());
    const decimals = await contract.decimals();
    console.log("contract decimals : ", decimals);
    const transferVolume = parseFloat(utils.formatUnits(totalVolume,decimals));

    setChartData((prevChartData) => {
      if (prevChartData.labels.length) {
        const newLabels = [...prevChartData.labels];
        if (newLabels[newLabels.length - 1].toString() !== blockNumber.toString()) {
          const newData = [...prevChartData.datasets[0].data];

          // Remove the first label and add a new block label at the end
          newLabels.shift();
          newLabels.push(blockNumber.toString());

          // Remove the first data and add a new volume data at the end
          newData.shift();
          newData.push(transferVolume);

          return {
            labels: newLabels,
            datasets: [
              {
                label: "Total Transfer Volume",
                data: newData,
                fill: false,
                backgroundColor: "rgba(75,192,192,0.4)",
                borderColor: "rgba(75,192,192,1)",
              },
            ],
          };
        }
      }
      return prevChartData;
    });
  };

  const handleNewBlock = useCallback((blockNumber) => {
    console.log(`Block ${blockNumber} passed`);
    addNewBlock(blockNumber);
  }, []);

  useEffect(() => {
    getTransferData();
    // Listen for new blocks
    if (!socket) {
      const ws = alchemy.ws;
      setSocket(ws);
      console.log("Socket is set for first time in Transfer Chart");
      ws.on("block", handleNewBlock);
    }

    // Remove listener on component unmount
    return () => {
      alchemy.ws.off("block", handleNewBlock);
    };
  }, []);

  return (
    <div>
      <h2>Total Transfer Volume Chart</h2>
      {!chartData.datasets && <h4>Fetching transfer volume data from latest blocks please wait...</h4>}
      {chartData.datasets && (
        <Card style={{ width: "70%",marginTop: "5%" , marginLeft: "auto", marginRight: "auto"}}>
          <Card.Header>Total Transfer Volume Chart</Card.Header>
          <Card.Body>
            <Line data={chartData} options={chartOptions} />
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default TransferChart;
