import { useState, useEffect, useRef } from "react";
import "./App.css";
import pngBTC from "./assets/btc.png";

const dt: number = 1 / 60;
const data = new Map<string, any>();

function ToBTC(sats: number) {
  return ((1 / 100000000) * sats).toFixed(8);
}

function resetData(data: Map<string, any>) {
  data.set("sats", 0);
  data.set("satsPerClick", 1);
  data.set("satsPerSec", 0);
  data.set("lastTime", Date.now());
}

function App() {
  const [sats, setSats] = useState(0);
  const [satsPerClick, setSatsPerClick] = useState(1);
  const [satsPerSec, setSatsPerSec] = useState(0);
  const [basicUpgradeCost, setBasicUpgradeCost] = useState(10);
  const [basicUpgradeValue, setBasicUpgradeValue] = useState(0.1);
  const [isBouncing, setIsBouncing] = useState(false);

  // Refs to store the latest values
  const satsRef = useRef(sats);
  const satsPerClickRef = useRef(satsPerClick);
  const satsPerSecRef = useRef(satsPerSec);

  // Update refs whenever state changes
  useEffect(() => {
    satsRef.current = sats;
  }, [sats]);

  useEffect(() => {
    satsPerClickRef.current = satsPerClick;
  }, [satsPerClick]);

  useEffect(() => {
    satsPerSecRef.current = satsPerSec;
  }, [satsPerSec]);

  // Load data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("data");
    if (savedData) {
      const entries: [string, any][] = JSON.parse(savedData);
      entries.forEach(([key, value]) => data.set(key, value));

      const savedSats = data.get("sats") || 0;
      const savedSatsPerClick = data.get("satsPerClick") || 1;
      const savedSatsPerSec = data.get("satsPerSec") || 0;

      const lastTime = data.get("lastTime") || Date.now();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastTime) / 1000);

      setSats(() => savedSats + savedSatsPerSec * elapsedSeconds);
      setSatsPerClick(savedSatsPerClick);
      setSatsPerSec(savedSatsPerSec);
    } else {
      resetData(data);
    }
    console.log("asd");
  }, []);

  // Handle clicks
  const getSats = () => {
    setSats((prev) => prev + satsPerClick);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 150);
  };

  const buyUpgrade = () => {
    if (sats >= basicUpgradeCost) {
      setSats((prev) => prev - basicUpgradeCost);
      setBasicUpgradeCost((prev) => Math.round(prev * 1.1));
      setSatsPerSec(
        (prev) => Math.round((prev + basicUpgradeValue) * 1000) / 1000
      );
    }
  };

  // Update sats over time
  useEffect(() => {
    const intervalId = setInterval(() => {
      setSats(() => satsRef.current + satsPerSecRef.current * dt);
    }, dt * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Save data periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      data.set("sats", satsRef.current);
      data.set("satsPerClick", satsPerClickRef.current);
      data.set("satsPerSec", satsPerSecRef.current);
      data.set("lastTime", Date.now());

      localStorage.setItem("data", JSON.stringify(Array.from(data.entries())));
    }, 500);

    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures saving happens independently

  // Handle app focus
  useEffect(() => {
    const handleFocus = () => {
      const lastTime = data.get("lastTime");
      const now = Date.now();
      const elapsedSeconds = (now - lastTime) / 1000;
      console.log(elapsedSeconds);
      setSats(() => satsRef.current + satsPerSecRef.current * elapsedSeconds);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  return (
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
      <button onClick={buyUpgrade}>
        {basicUpgradeCost} sats to {basicUpgradeValue} sats/sec
      </button>
      <button onClick={() => resetData(data)}>Reset Game</button>
    </div>
  );
}

export default App;
