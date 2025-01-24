import { useState, useEffect, useRef } from "react";
import "./App.css";
import pngBTC from "./assets/btc.png";

let satsPerClick: number = 1;
let satsPerSec: number = 0;
const dt: number = 1 / 60;

function ToBTC(sats: number) {
  return ((1 / 100000000) * sats).toFixed(8);
}

function App() {
  const [sats, setSats] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);
  const [basicUpgradeCost, setBasicUpgradeCost] = useState(10);
  const [basicUpgradeValue, setBasicUpgradeValue] = useState(0.1);
  const satsRef = useRef(sats);
  const satsPerClickRef = useRef(satsPerClick);
  const satsPerSecRef = useRef(satsPerSec);

  // Load value from localStorage when the app initializes
  useEffect(() => {
    const savedSats = localStorage.getItem("sats");
    if (savedSats !== null) {
      setSats(Number(savedSats)); // Parse the saved value
    }
    const savedSatsPerSec = localStorage.getItem("satsPerSec");
    if (savedSatsPerSec !== null) {
      satsPerSec = Number(savedSatsPerSec); // Parse the saved value
    }
    const savedSatsPerClick = localStorage.getItem("satsPerClick");
    if (savedSatsPerClick !== null) {
      satsPerClick = Number(savedSatsPerClick); // Parse the saved value
    }
    const lastTime = localStorage.getItem("lastTime");

    if (lastTime !== null) {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - Number(lastTime)) / 1000);
      setSats((prevValue) => prevValue + satsPerSec * elapsedSeconds);
    }
  }, []); // Run once on mount

  const getSats = () => {
    setSats(() => sats + satsPerClick);
    setIsBouncing(true); // Trigger bounce
    setTimeout(() => {
      setIsBouncing(false); // Reset bounce state after animation completes
    }, 150); // Duration of the animation (adjust as necessary)
  };

  const buyUpgrade = (cost: number, upgrade: number) => {
    if (sats >= cost) {
      setSats(() => sats - cost);
      setBasicUpgradeCost(() => Math.round(basicUpgradeCost * 1.1));
      satsPerSec = Math.round((satsPerSec + upgrade) * 1000) / 1000;
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSats((prevValue) => prevValue + satsPerSec * dt);
    }, dt * 1000); // Approximately 60 FPS

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  // Keep the ref updated with the latest value
  useEffect(() => {
    satsRef.current = sats;
    satsPerSecRef.current = satsPerSec;
    satsPerClickRef.current = satsPerClick;
  }, [sats]);
  useEffect(() => {
    satsPerSecRef.current = satsPerSec;
  }, []);
  useEffect(() => {
    satsPerClickRef.current = satsPerClick;
  }, []);

  // Periodically save current game state and time to localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      localStorage.setItem("sats", satsRef.current.toString());
      localStorage.setItem("satsPerSec", satsPerSecRef.current.toString());
      localStorage.setItem("satsPerClick", satsPerClickRef.current.toString());
      localStorage.setItem("lastTime", now.toString());
    }, 500); // Save every 500ms

    return () => clearInterval(interval); // Cleanup on unmount
  }, []); // Empty dependency array ensures it runs only once

  // Check elapsed time when the app regains focus
  useEffect(() => {
    const handleFocus = () => {
      const lastTime = localStorage.getItem("lastTime");
      if (lastTime !== null) {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - Number(lastTime)) / 1000);
        setSats((prevValue) => prevValue + satsPerSec * elapsedSeconds);
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <>
      <div className="card">
        <img
          src={pngBTC}
          alt="BTC"
          onClick={getSats}
          className={isBouncing ? "btcClick" : "btcNormal"}
        />
        <h1>{sats.toFixed(1)} sats</h1>
        <h3>{ToBTC(sats)} BTCs</h3>
        <h4>{satsPerClick} sats/click</h4>
        <h4>{satsPerSec} sats/sec</h4>
        <h2>Buy Upgrades</h2>
        <button onClick={() => buyUpgrade(basicUpgradeCost, basicUpgradeValue)}>
          {basicUpgradeCost} sats to {basicUpgradeValue} sats/sec
        </button>
        <button onClick={() => buyUpgrade(basicUpgradeCost, basicUpgradeValue)}>
          {basicUpgradeCost} sats to {basicUpgradeValue} sats/sec
        </button>
      </div>
    </>
  );
}

export default App;
