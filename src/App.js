import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import WavePortalContract from "./utils/WavePorta.json";

export default function App() {
  const WavePortalContractAddress =
    "0x90baB614ec7298015f2b25ffF57273E49b0a79c3";
  const [allWaves, setAllWaves] = useState([]);
  const [currentAccount, setCurrentAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [wavesCount, setWavesCount] = useState(0);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
       * Check if we're authorized to access the user's wallet
       */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          WavePortalContractAddress,
          WavePortalContract.abi,
          signer
        );

        const waves = await wavePortalContract.getAllWaves();

        setAllWaves(
          waves.map((wave) => {
            return {
              address: wave.waver,
              timestamp: new Date(wave.timestamp * 1000).toLocaleString(),
              message: wave.message,
            };
          })
        );
      } else {
        console.log("Ethetreum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const readWaves = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          WavePortalContractAddress,
          WavePortalContract.abi,
          signer
        );

        setLoading(true);
        // Read Waves
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setWavesCount(count.toNumber());

        setLoading(false);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async (message) => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          WavePortalContractAddress,
          WavePortalContract.abi,
          signer
        );

        // let count = await wavePortalContract.getTotalWaves();
        // console.log("Retrieved total wave count...", count.toNumber());

        setLoading(true);

        /*
         * Execute the actual wave from your smart contract
         */
        const waveTxn = await wavePortalContract.wave(message, {
          gasLimit: 300000,
        });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setWavesCount(count.toNumber());

        // getAllWaves();

        setLoading(false);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    checkIfWalletIsConnected();
    readWaves();
    // eslint-disable-next-line
  }, []);

  /**
   * Listen in for emitter events!
   */
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000).toLocaleString(),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        WavePortalContractAddress,
        WavePortalContract.abi,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  const handleSubmit = (event) => {
    const message = event.target.message.value;
    if (message.length) {
      wave(message);
    } else {
      alert("Please enter some message!");
    }
    return event.preventDefault();
  };

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="">
            👋
          </span>{" "}
          Hey there!
        </div>

        <div className="bio">
          I am Saad and I worked on Full Stack Projects so if that's pretty cool
          for you? Connect your Ethereum wallet and wave at me!
        </div>
        {loading ? (
          <img
            src="/loading.gif"
            style={{ width: "32px", marginTop: "20px" }}
            alt="loading"
          />
        ) : (
          <>
            <h3 style={{ textAlign: "center" }}>
              Total Waves: {wavesCount}{" "}
              <span role="img" aria-label="">
                👋
              </span>{" "}
            </h3>
            <div>
              <form onSubmit={handleSubmit}>
                <input
                  name="message"
                  type="text"
                  maxLength={100}
                  style={{ width: "380px", height: "26px" }}
                  placeholder="Type Something Here"
                />
                <button className="waveButton" type="submit">
                  Wave at Me
                </button>
              </form>
            </div>
          </>
        )}
        {/*
         * If there is no currentAccount render this button
         */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div
              key={index}
              style={{
                backgroundColor: "#9795ef",
                marginTop: "16px",
                padding: "8px",
                borderRadius: "10px",
                width: "100%",
              }}
            >
              <div style={{ fontSize: "22px", marginBottom: "5px" }}>
                "{wave.message}"
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: "10px", textAlign: "left" }}>
                  From Address: {wave.address}
                </div>
                <div style={{ fontSize: "10px", textAlign: "right" }}>
                  On Time: {wave.timestamp}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
