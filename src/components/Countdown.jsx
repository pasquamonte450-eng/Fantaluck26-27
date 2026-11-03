import { Fragment, useEffect, useState } from "react";
import { getWeekState } from "../utils/week";

const getRemaining = (target) =>
  Math.max(0, new Date(target).getTime() - Date.now());

const pad = (value) => String(value).padStart(2, "0");

export default function Countdown({ week }) {
  const state = getWeekState(week);

  const target =
    state === "waiting"
      ? week?.starts_at
      : state === "open"
      ? week?.deadline
      : null;

  const [remaining, setRemaining] = useState(() =>
    target ? getRemaining(target) : 0
  );

  useEffect(() => {
    if (!target) {
      setRemaining(0);
      return;
    }

    const update = () => setRemaining(getRemaining(target));

    update();

    const timer = setInterval(update, 1000);

    return () => clearInterval(timer);
  }, [target]);

  if (!target || (state !== "waiting" && state !== "open")) {
    return null;
  }

  const totalSeconds = Math.floor(remaining / 1000);

  const units = [
    { value: Math.floor(totalSeconds / 86400), label: "GIORNI" },
    { value: Math.floor((totalSeconds % 86400) / 3600), label: "ORE" },
    { value: Math.floor((totalSeconds % 3600) / 60), label: "MIN" },
    { value: totalSeconds % 60, label: "SEC" },
  ];

  return (
    <div className="countdownCard">
      <div className="countdownLabel">
        <span className="countdownDot" />

        {state === "waiting" ? "LA SFIDA INIZIA TRA" : "PUOI GIOCARE FINO A"}
      </div>

      <div className="countdownNumbers">
        {units.map((unit, index) => (
          <Fragment key={unit.label}>
            {index > 0 && <b>:</b>}

            <div>
              <strong>{pad(unit.value)}</strong>
              <small>{unit.label}</small>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
