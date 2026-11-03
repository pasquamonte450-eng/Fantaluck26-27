import Icon from "../../components/Icon";

export default function AdminResults({
  week,
  attempts,
  onBack,
  onEditAnswers,
  onPublish,
}) {
  return (
    <div>
      <button className="backButton" onClick={onBack}>
        <Icon name="arrow-left" size={16} />
        TORNA ALLE SETTIMANE
      </button>

      <div className="resultsAdmin">
        <h2>Risultati — Settimana #{week.number}</h2>

        <div className="publishBox">
          <h3>Correzione risposte</h3>

          <p>Inserisci le risposte corrette modificando la settimana.</p>

          <button onClick={() => onEditAnswers(week)}>
            MODIFICA RISPOSTE CORRETTE
          </button>

          <button className="publishButton" onClick={() => onPublish(week)}>
            CALCOLA E PUBBLICA RISULTATI
          </button>
        </div>

        <div className="table">
          {attempts.map((attempt) => (
            <div className="row" key={attempt.id}>
              <span>
                <b>{attempt.name || attempt.username}</b>

                <small>
                  {attempt.rigori_finished
                    ? "Partecipazione completa"
                    : "Rigori non completati"}
                </small>
              </span>

              <strong>
                {attempt.results_published ? attempt.final_score : "—"}
              </strong>
            </div>
          ))}

          {!attempts.length && (
            <div className="empty">Nessun partecipante.</div>
          )}
        </div>
      </div>
    </div>
  );
}
