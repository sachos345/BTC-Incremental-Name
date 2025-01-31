// App.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import "./App.css";

const dt = 1 / 60;

type MinerType = keyof typeof minersConfig;
type UpgradeType = keyof typeof upgradesConfig;

interface GameState {
  sats: number;
  hashrate: number;
  miners: Record<MinerType, number>;
  upgrades: Record<UpgradeType, number>;
  lastSaved: number;
  combo: {
    multiplier: number;
    timeout: number | null;
  };
  temporary: {
    quantumActive: boolean;
  };
  unlockedMinerIndex: number;
}

const minersConfig = {
  handCrank: {
    name: "Hand Crank",
    emoji: "🎮",
    baseCost: 50,
    costMultiplier: 1.1,
    production: 0.05,
    description: "Manual generator producing 0.05 sat/seconds (+10% cost each)",
  },
  potatoBattery: {
    name: "Potato Battery",
    emoji: "🥔",
    baseCost: 75,
    costMultiplier: 1.15,
    production: 0.08,
    description: "Biodegradable low-power mining (+15% cost each)",
  },
  hamsterWheel: {
    name: "Hamster Wheel",
    emoji: "🐹",
    baseCost: 113,
    costMultiplier: 1.2,
    production: 0.12,
    description: "Rodent-powered energy mining (+20% cost each)",
  },
  raspberry: {
    name: "Raspberry Pi Cluster",
    emoji: "🍇",
    baseCost: 170,
    costMultiplier: 1.25,
    production: 0.18,
    description:
      "ARM-powered cluster generating 0.18 sat/seconds (+25% cost each)",
  },
  smartphoneFarm: {
    name: "Smartphone Farm",
    emoji: "📱",
    baseCost: 255,
    costMultiplier: 1.3,
    production: 0.27,
    description: "Old smartphones mining in parallel (+30% cost each)",
  },
  cpu: {
    name: "CPU Miner",
    emoji: "💻",
    baseCost: 383,
    costMultiplier: 1.35,
    production: 0.41,
    description: "Basic CPU miner generating 0.41 sat/seconds (+35% cost each)",
  },
  gpu: {
    name: "GPU Farm",
    emoji: "🎮",
    baseCost: 575,
    costMultiplier: 1.4,
    production: 0.62,
    description: "GPU farm generating 0.62 sat/seconds (+40% cost each)",
  },
  asic: {
    name: "ASIC Warehouse",
    emoji: "🏭",
    baseCost: 863,
    costMultiplier: 1.45,
    production: 0.93,
    description: "ASIC warehouse generating 0.93 sat/seconds (+45% cost each)",
  },
  dataCenter: {
    name: "Mega Data Center",
    emoji: "🏢",
    baseCost: 1295,
    costMultiplier: 1.5,
    production: 1.4,
    description:
      "Massive data center generating 1.40 sat/seconds (+50% cost each)",
  },
  biofuelGenerator: {
    name: "Biofuel Generator",
    emoji: "🌿",
    baseCost: 1943,
    costMultiplier: 1.5,
    production: 2.1,
    description: "Algae-based rig generating 2.10 sat/seconds (+50% cost each)",
  },
  wind: {
    name: "Wind Turbine Array",
    emoji: "🌬️",
    baseCost: 2915,
    costMultiplier: 1.5,
    production: 3.15,
    description: "Wind array generating 3.15 sat/seconds (+50% cost each)",
  },
  solar: {
    name: "Solar Farm",
    emoji: "☀️",
    baseCost: 4373,
    costMultiplier: 1.5,
    production: 4.73,
    description: "Solar farm generating 4.73 sat/seconds (+50% cost each)",
  },
  hydro: {
    name: "Hydroelectric Rig",
    emoji: "💧",
    baseCost: 6560,
    costMultiplier: 1.5,
    production: 7.1,
    description: "Hydro rig generating 7.10 sat/seconds (+50% cost each)",
  },
  geothermal: {
    name: "Geothermal Plant",
    emoji: "🌋",
    baseCost: 9840,
    costMultiplier: 1.5,
    production: 10.65,
    description:
      "Geothermal plant generating 10.65 sat/seconds (+50% cost each)",
  },
  nuclear: {
    name: "Nuclear Plant",
    emoji: "☢️",
    baseCost: 14760,
    costMultiplier: 1.5,
    production: 15.98,
    description:
      "Nuclear facility generating 15.98 sat/seconds (+50% cost each)",
  },
  satellite: {
    name: "Orbital Satellite",
    emoji: "🛰️",
    baseCost: 22140,
    costMultiplier: 1.5,
    production: 23.97,
    description:
      "Orbital satellite generating 23.97 sat/seconds (+50% cost each)",
  },
  quantumAsic: {
    name: "Quantum ASIC",
    emoji: "⚛️",
    baseCost: 33210,
    costMultiplier: 1.5,
    production: 35.96,
    description: "Quantum ASIC generating 35.96 sat/seconds (+50% cost each)",
  },
  dyson: {
    name: "Dyson Sphere",
    emoji: "🌞",
    baseCost: 49815,
    costMultiplier: 1.5,
    production: 53.94,
    description: "Dyson sphere generating 53.94 sat/seconds (+50% cost each)",
  },
  lunarMiner: {
    name: "Lunar Miner",
    emoji: "🌕",
    baseCost: 74723,
    costMultiplier: 1.5,
    production: 80.91,
    description:
      "Moon-based miner generating 80.91 sat/seconds (+50% cost each)",
  },
  aiCluster: {
    name: "AI Cluster",
    emoji: "🤖",
    baseCost: 112085,
    costMultiplier: 1.5,
    production: 121.37,
    description: "AI cluster generating 121.37 sat/seconds (+50% cost each)",
  },
  plasmaReactor: {
    name: "Plasma Reactor",
    emoji: "⚡",
    baseCost: 168128,
    costMultiplier: 1.5,
    production: 182.06,
    description:
      "Plasma reactor generating 182.06 sat/seconds (+50% cost each)",
  },
  asteroidMiner: {
    name: "Asteroid Miner",
    emoji: "☄️",
    baseCost: 252192,
    costMultiplier: 1.5,
    production: 273.09,
    description:
      "Asteroid miner generating 273.09 sat/seconds (+50% cost each)",
  },
  neutrinoArray: {
    name: "Neutrino Array",
    emoji: "🌀",
    baseCost: 378288,
    costMultiplier: 1.5,
    production: 409.64,
    description:
      "Neutrino array generating 409.64 sat/seconds (+50% cost each)",
  },
  timeDilator: {
    name: "Time Dilator",
    emoji: "⏳",
    baseCost: 567432,
    costMultiplier: 1.5,
    production: 614.46,
    description: "Time dilator generating 614.46 sat/seconds (+50% cost each)",
  },
  darkMatterForge: {
    name: "Dark Matter Forge",
    emoji: "🌌",
    baseCost: 851148,
    costMultiplier: 1.5,
    production: 921.69,
    description:
      "Dark matter forge generating 921.69 sat/seconds (+50% cost each)",
  },
  quantumSingularity: {
    name: "Quantum Singularity",
    emoji: "⚛️",
    baseCost: 1276722,
    costMultiplier: 1.5,
    production: 1382.54,
    description:
      "Quantum singularity generating 1382.54 sat/seconds (+50% cost each)",
  },
  galacticCoreTap: {
    name: "Galactic Core Tap",
    emoji: "🌠",
    baseCost: 1915083,
    costMultiplier: 1.5,
    production: 2073.81,
    description:
      "Galactic core tap generating 2073.81 sat/seconds (+50% cost each)",
  },
  multiverseBridge: {
    name: "Multiverse Bridge",
    emoji: "🔮",
    baseCost: 2872625,
    costMultiplier: 1.5,
    production: 3110.72,
    description:
      "Multiverse bridge generating 3110.72 sat/seconds (+50% cost each)",
  },
  cosmicHorizon: {
    name: "Cosmic Horizon",
    emoji: "🕳️",
    baseCost: 4308938,
    costMultiplier: 1.5,
    production: 4666.08,
    description:
      "Cosmic horizon generating 4666.08 sat/seconds (+50% cost each)",
  },
  omnipotentNode: {
    name: "Omnipotent Node",
    emoji: "♾️",
    baseCost: 6463407,
    costMultiplier: 1.5,
    production: 6999.12,
    description:
      "Omnipotent node generating 6999.12 sat/seconds (+50% cost each)",
  },
} as const;

const upgradesConfig = {
  gloves: {
    name: "Click Gloves",
    emoji: "🧤",
    baseCost: 250,
    costMultiplier: 1.15,
    description: "+25% click power per level (+15% cost each)",
  },
  mouse: {
    name: "Quantum Mouse",
    emoji: "🖱️",
    baseCost: 2500,
    costMultiplier: 1.15,
    description: "+1s combo duration per level (+15% cost each)",
  },
  miningPool: {
    name: "Mining Pool",
    emoji: "🌐",
    baseCost: 10000,
    costMultiplier: 1.2,
    description: "+15% total hashrate per level (+20% cost each)",
  },
  quantum: {
    name: "Quantum Computer",
    emoji: "⚛️",
    baseCost: 500000,
    costMultiplier: 2,
    description: "10x hashrate for 30s (cost doubles each purchase)",
    isTemporary: true,
  },
  cloud: {
    name: "Cloud Mining",
    emoji: "☁️",
    baseCost: 25000,
    costMultiplier: 1.25,
    description: "+50 flat hashrate per level (+25% cost each)",
  },
} as const;

const initialMinersState = Object.keys(minersConfig).reduce((acc, key) => {
  acc[key as MinerType] = 0;
  return acc;
}, {} as Record<MinerType, number>);

const initialUpgradesState = Object.keys(upgradesConfig).reduce((acc, key) => {
  acc[key as UpgradeType] = 0;
  return acc;
}, {} as Record<UpgradeType, number>);

const initialState: GameState = {
  sats: 0,
  hashrate: 0,
  miners: initialMinersState,
  upgrades: initialUpgradesState,
  lastSaved: Date.now(),
  combo: { multiplier: 1, timeout: null },
  temporary: { quantumActive: false },
  unlockedMinerIndex: 3, // Show first 4 miners
};

// Add miners order array (top of component)
const minersOrder = Object.keys(minersConfig) as MinerType[];

const formatNumber = (num: number) => num.toLocaleString("en-US");

function App() {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem("btcClickerSave");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...initialState,
          ...parsed,
          sats: parsed.sats || 0,
          hashrate: parsed.hashrate || 0,
          miners: { ...initialMinersState, ...(parsed.miners || {}) },
          upgrades: { ...initialUpgradesState, ...(parsed.upgrades || {}) },
          lastSaved: parsed.lastSaved || Date.now(),
          temporary: { ...initialState.temporary, ...(parsed.temporary || {}) },
        };
      } catch {
        return initialState;
      }
    }
    return initialState;
  });

  const [clickFeedback, setClickFeedback] = useState<{
    amount: number;
    visible: boolean;
  }>({ amount: 0, visible: false });

  const effectiveHashrate = useMemo(() => {
    let base = state.hashrate;
    if (state.upgrades.miningPool > 0) {
      base *= 1 + state.upgrades.miningPool * 0.15;
    }
    if (state.upgrades.cloud > 0) {
      base += state.upgrades.cloud * 50;
    }
    if (state.temporary.quantumActive) {
      base *= 10;
    }
    return base;
  }, [state.hashrate, state.upgrades, state.temporary.quantumActive]);

  useEffect(() => {
    const saveState = (timestamp: number) => {
      localStorage.setItem(
        "btcClickerSave",
        JSON.stringify({
          ...state,
          sats: state.sats,
          hashrate: state.hashrate,
          lastSaved: timestamp,
          combo: { multiplier: 1, timeout: null },
        })
      );
    };

    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.visibilityState === "hidden") {
        saveState(now);
        setState((prev) => ({ ...prev, lastSaved: now }));
      } else {
        const offlineTime = Math.max(now - state.lastSaved - 1000, 0);
        setState((prev) => ({
          ...prev,
          sats: prev.sats + effectiveHashrate * (offlineTime / 1000),
          lastSaved: now,
        }));
      }
    };

    const handleBeforeUnload = () => saveState(Date.now());

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [state, effectiveHashrate]);

  useEffect(() => {
    const saved = localStorage.getItem("btcClickerSave");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      const savedTime = parsed.lastSaved || Date.now();
      const offlineTime = Math.max(Date.now() - savedTime - 1000, 0);
      const earnings = (parsed.hashrate || 0) * (offlineTime / 1000);

      setState((prev) => ({
        ...prev,
        sats: prev.sats + earnings,
        lastSaved: Date.now(),
      }));
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        sats: prev.sats + effectiveHashrate * dt,
      }));
    }, 1000 * dt);
    return () => clearInterval(interval);
  }, [effectiveHashrate]);

  useEffect(() => {
    if (!state.temporary.quantumActive) return;

    const timeout = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        temporary: { ...prev.temporary, quantumActive: false },
      }));
    }, 30000);

    return () => clearTimeout(timeout);
  }, [state.temporary.quantumActive]);

  useEffect(() => {
    return () => {
      if (state.combo.timeout) clearTimeout(state.combo.timeout);
    };
  }, [state.combo.timeout]);

  const handleMine = useCallback(() => {
    setState((prev) => {
      const clickPower =
        1 * (1 + prev.upgrades.gloves * 0.25) * prev.combo.multiplier;

      const newCombo = { ...prev.combo };
      if (newCombo.timeout) clearTimeout(newCombo.timeout);

      newCombo.multiplier = Math.min(prev.combo.multiplier + 0.1, 2);
      newCombo.timeout = setTimeout(() => {
        setState((s) => ({ ...s, combo: { ...s.combo, multiplier: 1 } }));
      }, 500 + prev.upgrades.mouse * 1000) as unknown as number;

      setClickFeedback({ amount: clickPower, visible: true });
      setTimeout(
        () => setClickFeedback((prev) => ({ ...prev, visible: false })),
        1000
      );

      return {
        ...prev,
        sats: prev.sats + clickPower,
        combo: newCombo,
      };
    });
  }, []);

  const buyUpgrade = useCallback((type: MinerType | UpgradeType) => {
    setState((prev) => {
      const isMiner = type in minersConfig;
      const config = isMiner
        ? minersConfig[type as MinerType]
        : upgradesConfig[type as UpgradeType];
      const currentCount = isMiner
        ? prev.miners[type as MinerType]
        : prev.upgrades[type as UpgradeType];

      const cost =
        config.baseCost * Math.pow(config.costMultiplier, currentCount);

      if (prev.sats < cost) return prev;

      const newState = {
        ...prev,
        sats: prev.sats - cost,
        miners: { ...prev.miners },
        upgrades: { ...prev.upgrades },
        temporary: { ...prev.temporary },
      };

      if (isMiner) {
        const minerType = type as MinerType;
        newState.miners[minerType] += 1;
        newState.hashrate = prev.hashrate + minersConfig[minerType].production;
        // Unlock next miner if purchasing the current last one
        const purchasedIndex = minersOrder.indexOf(minerType);
        if (purchasedIndex === prev.unlockedMinerIndex) {
          newState.unlockedMinerIndex = Math.min(
            prev.unlockedMinerIndex + 1,
            minersOrder.length - 1
          );
        }
      } else {
        const upgradeType = type as UpgradeType;
        newState.upgrades[upgradeType] += 1;
        if (upgradeType === "quantum") {
          newState.temporary.quantumActive = true;
        }
      }

      return newState;
    });
  }, []);

  const handleReset = useCallback(() => {
    localStorage.removeItem("btcClickerSave");
    setState(initialState);
  }, []);

  return (
    <div className="app">
      <button
        className="reset-button"
        onClick={handleReset}
        aria-label="Reset game"
      >
        X
      </button>
      <h1 className="title glow-text">₿itcoin Clicker</h1>

      <main className="main-column">
        <button
          className="bitcoin-button"
          onClick={handleMine}
          style={{ transform: `scale(${1 + state.combo.multiplier * 0.1})` }}
          aria-label="Mine Bitcoin"
        >
          ₿
          <div className="combo-indicator">
            {state.combo.multiplier > 1 &&
              `x${state.combo.multiplier.toFixed(1)}`}
          </div>
          {clickFeedback.visible && (
            <div className="click-feedback">
              +{formatNumber(clickFeedback.amount)}
            </div>
          )}
        </button>

        <div className="stats-panel">
          <div className="stat">
            <span className="stat-label">Satoshis:</span>
            <span className="stat-value">{formatNumber(state.sats)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Hashrate:</span>
            <span className="stat-value">
              {formatNumber(effectiveHashrate)}/s 🔥
              {state.temporary.quantumActive && " (Quantum Boosted)"}
            </span>
          </div>
        </div>

        <div className="upgrades-container">
          <section className="miners-section">
            <h2>⛏️ Miners</h2>
            <div className="upgrades-grid">
              {minersOrder
                .slice(0, state.unlockedMinerIndex + 1)
                .map((type) => {
                  const config = minersConfig[type];
                  const cost =
                    config.baseCost *
                    Math.pow(config.costMultiplier, state.miners[type]);
                  const production = state.miners[type] * config.production;

                  return (
                    <button
                      key={type}
                      className="upgrade-card"
                      onClick={() => buyUpgrade(type)}
                      disabled={state.sats < cost}
                      aria-disabled={state.sats < cost}
                    >
                      <h3>
                        {config.emoji} {config.name}
                      </h3>
                      <p>{config.description}</p>
                      <div>Owned: {state.miners[type]}</div>
                      <div>Production: {formatNumber(production)}/s</div>
                      <div>Cost: {formatNumber(cost)} sats</div>
                    </button>
                  );
                })}
            </div>
          </section>

          <section className="boost-section">
            <h2>⚡ Upgrades</h2>
            <div className="upgrades-grid">
              {(Object.keys(upgradesConfig) as UpgradeType[]).map((type) => {
                const config = upgradesConfig[type];
                const cost =
                  config.baseCost *
                  Math.pow(config.costMultiplier, state.upgrades[type]);
                return (
                  <button
                    key={type}
                    className="upgrade-card"
                    onClick={() => buyUpgrade(type)}
                    disabled={
                      state.sats < cost ||
                      (type === "quantum" && state.temporary.quantumActive)
                    }
                    aria-disabled={
                      state.sats < cost ||
                      (type === "quantum" && state.temporary.quantumActive)
                    }
                  >
                    <h3>
                      {config.emoji} {config.name}
                    </h3>
                    <p>{config.description}</p>
                    <div>Owned: {state.upgrades[type]}</div>
                    <div>Cost: {formatNumber(cost)} sats</div>
                    {type === "quantum" && state.temporary.quantumActive && (
                      <div className="cooldown">Active!</div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
