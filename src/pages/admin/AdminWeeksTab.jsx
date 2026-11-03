import { getWeekState } from "../../utils/week";

const STATE_LABELS = {
  open: "APERTA",
  waiting: "IN ATTESA",
  closed: "CHIUSA",
  published: "RISULTATI PUBBLICATI",
  draft: "BOZZA",
};

export default function AdminWeeksTab({
  weeks,
  onCreate,
  onEdit,
  onResults,
  onToggle,
  onRemove,
}) {
  return (
    <>
      <button className="primaryAdminButton" onClick={onCreate}>
        + CREA NUOVA SETTIMANA
      </button>

      <div className="table">
        {weeks.map((week) => {
          const state = getWeekState(week);

          return (
            <div className="adminWeek" key={week.id}>
              <div>
                <b>SETTIMANA #{week.number}</b>

                <small>{STATE_LABELS[state]}</small>
              </div>

              <div className="adminActions">
                <button onClick={() => onEdit(week)}>MODIFICA</button>

                <button onClick={() => onResults(week)}>RISULTATI</button>

                <button onClick={() => onToggle(week)}>
                  {state === "open" ? "CHIUDI" : "APRI"}
                </button>

                <button className="danger" onClick={() => onRemove(week)}>
                  ELIMINA
                </button>
              </div>
            </div>
          );
        })}

        {!weeks.length && (
          <div className="empty">
            Nessuna settimana creata.
            <br />
            Crea la Settimana #1.
          </div>
        )}
      </div>
    </>
  );
}
