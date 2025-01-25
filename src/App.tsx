// App.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import Decimal from "decimal.js";
import "./App.css";

const dt = new Decimal(1 / 60);

interface GameState {
  sats: Decimal;
  hashrate: Decimal;
  miners: {
    cpu: number;
    gpu: number;
    asic: number;
  };
  upgrades: {
    gloves: number;
    mouse: number;
    miningPool: number;
    quantum: number;
    cloud: number;
  };
  lastSaved: number;
  combo: {
    multiplier: number;
    timeout: NodeJS.Timeout | null;
  };
  temporary: {
    quantumActive: boolean;
  };
}

const initialState: GameState = {
  sats: new Decimal(0),
  hashrate: new Decimal(0),
  miners: { cpu: 0, gpu: 0, asic: 0 },
  upgrades: { gloves: 0, mouse: 0, miningPool: 0, quantum: 0, cloud: 0 },
  lastSaved: Date.now(),
  combo: { multiplier: 1, timeout: null },
  temporary: { quantumActive: false },
};

// Utility function to format numbers with commas
const formatNumber = (num: Decimal) => {
  return num.toNumber().toLocaleString("en-US");
};

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
          miners: {
            ...initialState.miners,
            ...(parsed.miners || {}),
          },
          upgrades: {
            ...initialState.upgrades,
            ...(parsed.upgrades || {}),
          },
          lastSaved: parsed.lastSaved || Date.now(),
          temporary: {
            ...initialState.temporary,
            ...(parsed.temporary || {}),
          },
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
  }>({
    amount: new Decimal(0),
    visible: false,
  });

  // Calculate effective hashrate with memoization
  const effectiveHashrate = useMemo(() => {
    let base = state.hashrate;
    if (state.upgrades.miningPool > 0) {
      base = base.times(new Decimal(1).plus(state.upgrades.miningPool * 0.15));
    }
    if (state.upgrades.cloud > 0) {
      base = base.plus(state.upgrades.cloud * 50);
    }
    if (state.temporary.quantumActive) {
      base = base.times(10);
    }
    return base;
  }, [
    state.hashrate,
    state.upgrades.miningPool,
    state.upgrades.cloud,
    state.temporary.quantumActive,
  ]);

  // Save system
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const newState = {
          ...prev,
          lastSaved: Date.now(), // Update lastSaved when saving
        };
        localStorage.setItem(
          "btcClickerSave",
          JSON.stringify({
            ...newState,
            sats: newState.sats.toString(),
            hashrate: newState.hashrate.toString(),
            combo: { multiplier: 1, timeout: null },
          })
        );
        return newState;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);
  // Offline earnings calculation to use saved hashrate
  useEffect(() => {
    const saved = localStorage.getItem("btcClickerSave");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      const savedHashrate = new Decimal(parsed.hashrate || 0);
      const savedTime = parsed.lastSaved || Date.now();

      // Calculate time difference with minimum 1 second threshold
      const rawOfflineTime = Date.now() - savedTime;
      const offlineTime = Math.max(rawOfflineTime - 1000, 0);

      const baseEarnings = savedHashrate.times(offlineTime / 1000);

      setState((prev) => ({
        ...prev,
        sats: prev.sats.plus(baseEarnings),
        lastSaved: Date.now(), // Reset timer after claiming
      }));
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
  }, []);
  // Beforeunload handler to update lastSaved instantly
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem(
        "btcClickerSave",
        JSON.stringify({
          ...state,
          sats: state.sats.toString(),
          hashrate: state.hashrate.toString(),
          lastSaved: Date.now(), // Critical update
          combo: { multiplier: 1, timeout: null },
        })
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state]);

  // Passive income
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        sats: prev.sats.plus(effectiveHashrate.times(dt)), // Proper Decimal multiplication
      }));
    }, 1000 * dt.toNumber()); // Convert dt to milliseconds correctly
    return () => clearInterval(interval);
  }, [effectiveHashrate]);

  // Quantum activation timeout
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

  // Cleanup combo timeout on unmount
  useEffect(() => {
    return () => {
      if (state.combo.timeout) clearTimeout(state.combo.timeout);
    };
  }, [state.combo.timeout]);

  /*// Offline earnings
  useEffect(() => {
    const offlineTime = Math.min(Date.now() - state.lastSaved, 86400000);
    const offlineEarnings = effectiveHashrate.times(offlineTime / 1000);
    setState((prev) => ({
      ...prev,
      sats: prev.sats.plus(offlineEarnings),
      lastSaved: Date.now(),
    }));
  }, []);*/

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
      }, 500 + prev.upgrades.mouse * 1000);

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

  const buyUpgrade = useCallback(
    (type: keyof GameState["miners"] | keyof GameState["upgrades"]) => {
      setState((prev) => {
        let cost: Decimal;
        const currentCount =
          prev.miners[type as keyof GameState["miners"]] ||
          prev.upgrades[type as keyof GameState["upgrades"]];

        switch (type) {
          case "cpu":
            cost = new Decimal(100).mul(new Decimal(1.15).pow(prev.miners.cpu));
            break;
          case "gpu":
            cost = new Decimal(500).mul(new Decimal(1.15).pow(prev.miners.gpu));
            break;
          case "asic":
            cost = new Decimal(5000).mul(
              new Decimal(1.15).pow(prev.miners.asic)
            );
            break;
          case "gloves":
            cost = new Decimal(250).mul(
              new Decimal(1.15).pow(prev.upgrades.gloves)
            );
            break;
          case "mouse":
            cost = new Decimal(2500).mul(
              new Decimal(1.15).pow(prev.upgrades.mouse)
            );
            break;
          case "miningPool":
            cost = new Decimal(10000).mul(
              new Decimal(1.2).pow(prev.upgrades.miningPool)
            );
            break;
          case "quantum":
            cost = new Decimal(500000).mul(
              new Decimal(2).pow(prev.upgrades.quantum)
            );
            break;
          case "cloud":
            cost = new Decimal(25000).mul(
              new Decimal(1.25).pow(prev.upgrades.cloud)
            );
            break;
          default:
            return prev;
        }

        if (prev.sats.lessThan(cost)) return prev;

        const newState = {
          ...prev,
          sats: prev.sats.minus(cost),
          miners: { ...prev.miners },
          upgrades: { ...prev.upgrades },
          temporary: { ...prev.temporary },
        };

        if (["cpu", "gpu", "asic"].includes(type)) {
          const minerType = type as keyof GameState["miners"];
          newState.miners[minerType] += 1;
          newState.hashrate = prev.hashrate.plus(
            type === "cpu" ? 0.1 : type === "gpu" ? 1 : 10
          );
        } else {
          const upgradeType = type as keyof GameState["upgrades"];
          newState.upgrades[upgradeType] += 1;
          if (type === "quantum") {
            newState.temporary.quantumActive = true;
          }
        }

        return newState;
      });
    },
    []
  );

  const getUpgradeDescription = (type: string) => {
    switch (type) {
      case "cpu":
        return "Basic CPU miner generating 0.1 sat/seconds (+15% cost each)";
      case "gpu":
        return "GPU farm generating 1 sat/seconds (+15% cost each)";
      case "asic":
        return "ASIC warehouse generating 10 sat/seconds (+15% cost each)";
      case "gloves":
        return "+25% click power per level (+15% cost each)";
      case "mouse":
        return "+1s combo duration per level (+15% cost each)";
      case "miningPool":
        return "+15% total hashrate per level (+20% cost each)";
      case "quantum":
        return "10x hashrate for 30s (cost doubles each purchase)";
      case "cloud":
        return "+50 flat hashrate per level (+25% cost each)";
      default:
        return "";
    }
  };
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
              {(["cpu", "gpu", "asic"] as const).map((type) => {
                const cost = new Decimal(100)
                  .mul(new Decimal(1.15).pow(state.miners[type]))
                  .times(type === "gpu" ? 5 : type === "asic" ? 50 : 1);
                return (
                  <button
                    key={type}
                    className="upgrade-card"
                    onClick={() => buyUpgrade(type)}
                    disabled={state.sats.lessThan(cost)}
                    aria-disabled={state.sats.lessThan(cost)}
                  >
                    <h3>
                      {type === "cpu" && "💻 CPU Miner"}
                      {type === "gpu" && "🎮 GPU Farm"}
                      {type === "asic" && "🏭 ASIC Warehouse"}
                    </h3>
                    <p>{getUpgradeDescription(type)}</p>
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
              {(
                ["gloves", "mouse", "miningPool", "cloud", "quantum"] as const
              ).map((type) => {
                const cost = calculateCost(type, state);
                return (
                  <button
                    key={type}
                    className="upgrade-card"
                    onClick={() => buyUpgrade(type)}
                    disabled={
                      state.sats.lessThan(cost) ||
                      (type === "quantum" && state.temporary.quantumActive)
                    }
                    aria-disabled={
                      state.sats.lessThan(cost) ||
                      (type === "quantum" && state.temporary.quantumActive)
                    }
                  >
                    <h3>
                      {type === "gloves" && "🧤 Click Gloves"}
                      {type === "mouse" && "🖱️ Quantum Mouse"}
                      {type === "miningPool" && "🌐 Mining Pool"}
                      {type === "cloud" && "☁️ Cloud Mining"}
                      {type === "quantum" && "⚛️ Quantum Computer"}
                    </h3>
                    <p>{getUpgradeDescription(type)}</p>
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

const calculateCost = (type: string, state: GameState) => {
  switch (type) {
    case "cpu":
      return new Decimal(100).mul(new Decimal(1.15).pow(state.miners.cpu));
    case "gpu":
      return new Decimal(500).mul(new Decimal(1.15).pow(state.miners.gpu));
    case "asic":
      return new Decimal(5000).mul(new Decimal(1.15).pow(state.miners.asic));
    case "gloves":
      return new Decimal(250).mul(new Decimal(1.15).pow(state.upgrades.gloves));
    case "mouse":
      return new Decimal(2500).mul(new Decimal(1.15).pow(state.upgrades.mouse));
    case "miningPool":
      return new Decimal(10000).mul(
        new Decimal(1.2).pow(state.upgrades.miningPool)
      );
    case "quantum":
      return new Decimal(500000).mul(
        new Decimal(2).pow(state.upgrades.quantum)
      );
    case "cloud":
      return new Decimal(25000).mul(
        new Decimal(1.25).pow(state.upgrades.cloud)
      );
    default:
      return new Decimal(0);
  }
};

export default App;
