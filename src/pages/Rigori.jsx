import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import { callFunction } from "../services/api";
import { goalsAvailableForShot } from "../utils/rigori";

export default function Rigori({ week, onDone }) {
  const [shot, setShot] = useState(0);
  const [goals, setGoals] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const status = await callFunction("rigori", {
          week_id: week.id,
          action: "status",
        });

        if (cancelled) return;

        if (status.finished) {
          onDone();
          return;
        }

        setShot(status.shotNumber || 0);
        setGoals(status.goals || 0);
        setMultiplier(Number(status.multiplier || 1));
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Errore di connessione.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [week.id]);

  const shoot = async (cell) => {
    if (busy || result) return;

    setBusy(true);
    setError("");
    setSelected(cell);

    try {
      const response = await callFunction("rigori", {
        week_id: week.id,
        cell,
      });

      setResult({
        goal: response.goal,
        multiplier: response.multiplier,
      });

      setGoals(response.goals);
      setMultiplier(response.multiplier);
    } catch (err) {
      setError(err.message || "Errore di connessione.");

      setSelected(null);
    } finally {
      setBusy(false);
    }
  };

  const continueShot = () => {
    if (!result) return;

    if (!result.goal) {
      onDone();
      return;
    }

    setShot((s) => s + 1);

    setSelected(null);
    setResult(null);
  };

  if (loading) {
    return <div className="empty">Caricamento rigori...</div>;
  }

  const goalCount = goalsAvailableForShot(shot);

  return (
    <div className="wrap">
      <div className="penalty">
        <div className="penaltyTop">
          <span>RIGORI</span>

          <strong>{shot + 1}° RIGORE</strong>
        </div>

        <div
          className={
            result
              ? result.goal
                ? "keeper keeperGoal"
                : "keeper keeperSave"
              : "keeper"
          }
        >
          <Icon name="target" size={35} />

          <span>PORTA</span>
        </div>

        <h1>RIGORI</h1>

        <p>
          Scegli una casella.
          <br />
          Non sai dove si trova la parata.
        </p>

        <div className="difficulty">
          <b>{goalCount}/12</b>

          <span>possibilità di segnare</span>
        </div>

        <div className="goalGrid">
          {Array.from({ length: 12 }, (_, cell) => (
            <button
              key={cell}
              disabled={Boolean(result) || busy}
              className={selected === cell ? "selectedCell" : ""}
              onClick={() => shoot(cell)}
            >
              {cell + 1}
            </button>
          ))}
        </div>

        <div className="mult">
          <small>MOLTIPLICATORE</small>

          <strong className={result?.goal ? "multiplierPulse" : ""}>
            x{multiplier.toFixed(2)}
          </strong>

          <span>Gol: {goals}</span>
        </div>

        {error && <div className="error">{error}</div>}

        {result && (
          <div
            className={
              result.goal ? "shotResult goalResult" : "shotResult missResult"
            }
          >
            <div className="resultIcon">
              <Icon name={result.goal ? "ball" : "target"} size={42} />
            </div>

            <h2>{result.goal ? "GOOOOL!" : "PARATO!"}</h2>

            <p>
              {result.goal ? "Continua la serie!" : "La serie termina qui."}
            </p>

            <button onClick={continueShot}>
              {result.goal ? "PROSSIMO RIGORE" : "CONTINUA"}

              <Icon name="arrow" size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
