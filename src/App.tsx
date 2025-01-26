// App.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import Decimal from "decimal.js";
import "./App.css";

const dt = new Decimal(1 / 60);

type MinerType = keyof typeof minersConfig;
type UpgradeType = keyof typeof upgradesConfig;

interface GameState {
  sats: Decimal;
  hashrate: Decimal;
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
}

const minersConfig = {
  cpu: {
    name: "CPU Miner",
    emoji: "💻",
    baseCost: 100,
    costMultiplier: 1.15,
    production: 0.1,
    description: "Basic CPU miner generating 0.1 sat/seconds (+15% cost each)",
  },
  gpu: {
    name: "GPU Farm",
    emoji: "🎮",
    baseCost: 500,
    costMultiplier: 1.15,
    production: 1,
    description: "GPU farm generating 1 sat/seconds (+15% cost each)",
  },
  asic: {
    name: "ASIC Warehouse",
    emoji: "🏭",
    baseCost: 5000,
    costMultiplier: 1.15,
    production: 10,
    description: "ASIC warehouse generating 10 sat/seconds (+15% cost each)",
  },
  raspberry: {
    name: "Raspberry Pi Cluster",
    emoji: "🍇",
    baseCost: 50,
    costMultiplier: 1.12,
    production: 0.05,
    description:
      "Raspberry Pi cluster generating 0.05 sat/seconds (+12% cost each)",
  },
  solar: {
    name: "Solar Farm",
    emoji: "☀️",
    baseCost: 200,
    costMultiplier: 1.14,
    production: 0.4,
    description:
      "Solar-powered mining farm generating 0.4 sat/seconds (+14% cost each)",
  },
  nuclear: {
    name: "Nuclear Plant",
    emoji: "☢️",
    baseCost: 1000,
    costMultiplier: 1.16,
    production: 2,
    description:
      "Nuclear-powered facility generating 2 sat/seconds (+16% cost each)",
  },
  satellite: {
    name: "Orbital Satellite",
    emoji: "🛰️",
    baseCost: 5000,
    costMultiplier: 1.18,
    production: 5,
    description:
      "Orbital mining satellite generating 5 sat/seconds (+18% cost each)",
  },
  quantumAsic: {
    name: "Quantum ASIC",
    emoji: "⚛️",
    baseCost: 25000,
    costMultiplier: 1.2,
    production: 25,
    description:
      "Quantum-enhanced ASIC generating 25 sat/seconds (+20% cost each)",
  },
  hydro: {
    name: "Hydroelectric Rig",
    emoji: "💧",
    baseCost: 7500,
    costMultiplier: 1.15,
    production: 8,
    description:
      "Hydroelectric mining rig generating 8 sat/seconds (+15% cost each)",
  },
  geothermal: {
    name: "Geothermal Plant",
    emoji: "🌋",
    baseCost: 15000,
    costMultiplier: 1.17,
    production: 12,
    description: "Geothermal plant generating 12 sat/seconds (+17% cost each)",
  },
  wind: {
    name: "Wind Turbine Array",
    emoji: "🌬️",
    baseCost: 3000,
    costMultiplier: 1.13,
    production: 3,
    description: "Wind turbine array generating 3 sat/seconds (+13% cost each)",
  },
  dataCenter: {
    name: "Mega Data Center",
    emoji: "🏢",
    baseCost: 50000,
    costMultiplier: 1.25,
    production: 50,
    description:
      "Massive data center generating 50 sat/seconds (+25% cost each)",
  },
  dyson: {
    name: "Dyson Sphere",
    emoji: "🌞",
    baseCost: 1e6,
    costMultiplier: 1.3,
    production: 500,
    description:
      "Dyson sphere megastructure generating 500 sat/seconds (+30% cost each)",
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
  sats: new Decimal(0),
  hashrate: new Decimal(0),
  miners: initialMinersState,
  upgrades: initialUpgradesState,
  lastSaved: Date.now(),
  combo: { multiplier: 1, timeout: null },
  temporary: { quantumActive: false },
};

const formatNumber = (num: Decimal) => num.toNumber().toLocaleString("en-US");

function App() {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem("btcClickerSave");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...initialState,
          ...parsed,
          sats: new Decimal(parsed.sats || 0),
          hashrate: new Decimal(parsed.hashrate || 0),
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
    amount: Decimal;
    visible: boolean;
  }>({ amount: new Decimal(0), visible: false });

  const effectiveHashrate = useMemo(() => {
    let base = state.hashrate;
    if (state.upgrades.miningPool > 0) {
      base = base.times(new Decimal(1).plus(state.upgrades.miningPool * 0.15));
    }
    if (state.upgrades.cloud > 0) {
      base = base.plus(new Decimal(state.upgrades.cloud * 50));
    }
    if (state.temporary.quantumActive) {
      base = base.times(10);
    }
    return base;
  }, [state.hashrate, state.upgrades, state.temporary.quantumActive]);

  useEffect(() => {
    const saveState = (timestamp: number) => {
      localStorage.setItem(
        "btcClickerSave",
        JSON.stringify({
          ...state,
          sats: state.sats.toString(),
          hashrate: state.hashrate.toString(),
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
          sats: prev.sats.plus(effectiveHashrate.times(offlineTime / 1000)),
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
      const earnings = new Decimal(parsed.hashrate || 0).times(
        offlineTime / 1000
      );

      setState((prev) => ({
        ...prev,
        sats: prev.sats.plus(earnings),
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
        sats: prev.sats.plus(effectiveHashrate.times(dt)),
      }));
    }, 1000 * dt.toNumber());
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
      const clickPower = new Decimal(1)
        .times(new Decimal(1).plus(prev.upgrades.gloves * 0.25))
        .times(prev.combo.multiplier);

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
        sats: prev.sats.plus(clickPower),
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

      const cost = new Decimal(config.baseCost).times(
        new Decimal(config.costMultiplier).pow(currentCount)
      );

      if (prev.sats.lt(cost)) return prev;

      const newState = {
        ...prev,
        sats: prev.sats.sub(cost),
        miners: { ...prev.miners },
        upgrades: { ...prev.upgrades },
        temporary: { ...prev.temporary },
      };

      if (isMiner) {
        const minerType = type as MinerType;
        newState.miners[minerType] += 1;
        newState.hashrate = prev.hashrate.plus(
          minersConfig[minerType].production
        );
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
              {(Object.keys(minersConfig) as MinerType[]).map((type) => {
                const config = minersConfig[type];
                const cost = new Decimal(config.baseCost).times(
                  new Decimal(config.costMultiplier).pow(state.miners[type])
                );
                return (
                  <button
                    key={type}
                    className="upgrade-card"
                    onClick={() => buyUpgrade(type)}
                    disabled={state.sats.lt(cost)}
                    aria-disabled={state.sats.lt(cost)}
                  >
                    <h3>
                      {config.emoji} {config.name}
                    </h3>
                    <p>{config.description}</p>
                    <div>Owned: {state.miners[type]}</div>
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
                const cost = new Decimal(config.baseCost).times(
                  new Decimal(config.costMultiplier).pow(state.upgrades[type])
                );
                return (
                  <button
                    key={type}
                    className="upgrade-card"
                    onClick={() => buyUpgrade(type)}
                    disabled={
                      state.sats.lt(cost) ||
                      (type === "quantum" && state.temporary.quantumActive)
                    }
                    aria-disabled={
                      state.sats.lt(cost) ||
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
