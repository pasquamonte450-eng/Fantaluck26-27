import Icon from "../../components/Icon";
import QuestionEditor from "./QuestionEditor";
import { toDateTimeLocalValue } from "../../utils/week";

export default function AdminWeekEditor({
  week,
  setWeek,
  saving,
  onSave,
  onBack,
}) {
  return (
    <div>
      <button className="backButton" onClick={onBack}>
        <Icon name="arrow-left" size={16} />
        TORNA ALLE SETTIMANE
      </button>

      <div className="adminEditor">
        <h2>Settimana #{week.number}</h2>

        <label>
          Numero settimana
          <input
            type="number"
            value={week.number}
            onChange={(e) =>
              setWeek({ ...week, number: Number(e.target.value) })
            }
          />
        </label>

        <label>
          Apertura
          <input
            type="datetime-local"
            value={toDateTimeLocalValue(week.starts_at)}
            onChange={(e) => setWeek({ ...week, starts_at: e.target.value })}
          />
        </label>

        <label>
          Chiusura
          <input
            type="datetime-local"
            value={toDateTimeLocalValue(week.deadline)}
            onChange={(e) => setWeek({ ...week, deadline: e.target.value })}
          />
        </label>

        <QuestionEditor
          title="DOMANDE PARTITA — 10"
          questions={week.matchQuestions}
          onChange={(questions) =>
            setWeek({ ...week, matchQuestions: questions })
          }
        />

        <QuestionEditor
          title="DOMANDE GIOCATORE — 10"
          questions={week.playerQuestions}
          onChange={(questions) =>
            setWeek({ ...week, playerQuestions: questions })
          }
        />

        <div className="correctInfo">
          <Icon name="info" size={18} />
          Puoi selezionare una o più risposte corrette per ogni domanda.
        </div>

        <button className="saveBig" onClick={onSave} disabled={saving}>
          {saving ? "SALVATAGGIO..." : "SALVA SETTIMANA"}
        </button>
      </div>
    </div>
  );
}
