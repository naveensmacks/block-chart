import React, { useState, useEffect, useCallback } from "react";
import { Line } from "react-chartjs-2";
// eslint-disable-next-line no-unused-vars
import { Chart } from "chart.js/auto";
import { ethers } from "ethers";
import { Card } from "react-bootstrap";


const BaseFeeVsGasUtilizationChart = ({ erc20Address, alchemy }) => {
  const [chartData, setChartData] = useState([]);
  const [chartOptions, setChartOptions] = useState([]);
  const [gasChartData, setGasChartData] = useState([]);
  const [gasChartOptions, setGasChartOptions] = useState([]);
  const [socket, setSocket] = useState(null);
  const getChartData = (baseFeeData, label) => {
    let cd = {
      labels: Object.keys(baseFeeData),
      datasets: [
        {
          label: label,
          data: Object.values(baseFeeData),
          fill: false,
          backgroundColor: "rgba(200,32,192,0.4)",
          borderColor: "rgba(200,32,192,1)",
        },
      ],
    };
    return cd;
  }
  const getChartOptions = (xlabel, ylabel) => {
    const cp = {
      scales: {
        x: {
          title: {
            display: true,
            text: xlabel,
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
            text: ylabel,
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
    return cp;
  }
 
  const getBlockData = async () => {
    try {
      let latestBlockNumber = await alchemy.core.getBlockNumber();
      console.log("Latest Block Number : ", latestBlockNumber);
    
      let baseFeeData = {};
      let gasUtilRate = {};
      for (let i = 0; i < 10; i++) {
        const block = await alchemy.core.getBlock(latestBlockNumber);
        baseFeeData[latestBlockNumber] = parseFloat(
          ethers.utils.formatUnits(block.baseFeePerGas.toString(), "gwei")
        );
        gasUtilRate[latestBlockNumber] = parseFloat(block.gasUsed/block.gasLimit)*100;
        latestBlockNumber--;
      }

      console.log("baseFeeData : ", baseFeeData);
      const cd = getChartData(baseFeeData, "Base Fee Per Gas");
      console.log("chartData :", cd);
      const cp = getChartOptions("Block Numbers (last 10)", "Base Fee Per Gas (in GWEI)");
      console.log("chartOptions :", cp);

      console.log("gasUtilRate : ", gasUtilRate);
      const gcd = getChartData(gasUtilRate, "Gas Utilization Rate");
      console.log("chartData :", gcd);
      const gcp = getChartOptions("Block Numbers (last 10)", "Ratio of gasUsed to gasLimit (in Percentage)");
      console.log("chartOptions :", gcp);

      setChartData(cd);
      setChartOptions(cp);

      setGasChartData(gcd);
      setGasChartOptions(gcp);
    } catch (error) {
      console.error("N-ERROR. : ", error);
    }
  };

  const getUpdatedChartData = (prevChartData, blockNumber, data, label) => {
    if (prevChartData.labels) {
      const newLabels = [...prevChartData.labels];
      if (newLabels[newLabels.length - 1].toString() !== blockNumber.toString()) {
        const newData = [...prevChartData.datasets[0].data];

        newLabels.shift();
        newLabels.push(blockNumber.toString());

        newData.shift();
        newData.push(data);

        return {
          labels: newLabels,
          datasets: [
            {
              label: label,
              data: newData,
              fill: false,
              backgroundColor: "rgba(200,32,192,0.4)",
              borderColor: "rgba(200,32,192,1)",
            },
          ],
        };
      }
    }
    return prevChartData;
  };
  const addNewBlock = async (blockNumber) => {
    const block = await alchemy.core.getBlock(blockNumber);
    let baseFee = parseFloat(
      ethers.utils.formatUnits(block.baseFeePerGas.toString(), "gwei")
    );
    let gasUtilRate = parseFloat(block.gasUsed/block.gasLimit)*100;

    setChartData((prevChartData) => {
      return getUpdatedChartData(prevChartData, blockNumber, baseFee, "Base Fee Per Gas");
    });
    setGasChartData((prevChartData) => {
      return getUpdatedChartData(prevChartData, blockNumber, gasUtilRate, "Gas Utilization Rate");
    });
  };

  const handleNewBlock = useCallback((blockNumber) => {
    console.log(`Block ${blockNumber} passed`);
    addNewBlock(blockNumber);
  }, []);

  useEffect(() => {
    getBlockData();
    // Listen for new blocks
    if (!socket) {
      const ws = alchemy.ws;
      setSocket(ws);
      console.log("Socket is set for first time");
      ws.on("block", handleNewBlock);
    }

    // Remove listener on component unmount
    return () => {
      alchemy.ws.off("block", handleNewBlock);
    };
  }, []);

  return (
    <div>
      <h2>Base Fee Chart Vs Gas Utilization chart</h2>
      {!chartData.datasets && <h4>Fetching block data from the latest blocks please wait...</h4>}

      {chartData.datasets && (
        <Card style={{ width: "70%",marginTop: "5%" , marginLeft: "auto", marginRight: "auto"}}>
          <Card.Header>Base Fee Chart</Card.Header>
          <Card.Body>
            <Line data={chartData} options={chartOptions} />
          </Card.Body>
        </Card>
      )}

      {gasChartData.datasets && (
        <Card style={{ width: "70%",marginTop: "5%",marginBottom: "5%" , marginLeft: "auto", marginRight: "auto"}}>
          <Card.Header>Gas Utilization Rate Chart</Card.Header>
          <Card.Body>
            <Line data={gasChartData} options={gasChartOptions} />
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default BaseFeeVsGasUtilizationChart;
