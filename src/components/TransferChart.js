import React, { useState, useEffect, useCallback } from "react";
import { Line } from "react-chartjs-2";
// eslint-disable-next-line no-unused-vars
import { Chart } from "chart.js/auto";
import { Card } from "react-bootstrap";

const TransferChart = ({ erc20Address, alchemy }) => {
  const [chartData, setChartData] = useState([]);
  const [chartOptions, setChartOptions] = useState([]);
  const [socket, setSocket] = useState(null);

  const getTransferData = async () => {
    try {
      const latestBlockNumber = await alchemy.core.getBlockNumber();
      console.log("Latest Block Number : ", latestBlockNumber);

      let transferData = {};
      const result = await alchemy.core.getAssetTransfers({
        contract_addresses: [erc20Address],
        fromBlock: latestBlockNumber - 9,
        toBlock: "latest",
        category: ["erc20"],
      });
      console.log("result : ", result);

      // Calculate transferVolume for each block
      result.transfers.forEach((transfer) => {
        if (transfer.value !== null) {
          const blockNumber = parseInt(transfer.blockNum);
          const { value } = transfer;
          // Parse the transfer logs and calculate the total volume of transfers for each block
          const intVal = parseInt(value);
          if (transferData[blockNumber]) {
            transferData[blockNumber] += intVal;
          } else {
            transferData[blockNumber] = intVal;
          }
        }
      });

      console.log("TransferData : ", transferData);
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
    let transferVolume = 0;
    const result = await alchemy.core.getAssetTransfers({
      contract_addresses: [erc20Address],
      fromBlock: blockNumber,
      toBlock: blockNumber,
      category: ["erc20"],
    });

    // Extract the transfer details
    result.transfers.forEach((transfer) => {
      if (transfer.value !== null) {
        const { value } = transfer;
        // Parse the transfer logs and calculate the total volume of latest block
        transferVolume += parseInt(value);
      }
    });

    setChartData((prevChartData) => {
      if (prevChartData.labels) {
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
