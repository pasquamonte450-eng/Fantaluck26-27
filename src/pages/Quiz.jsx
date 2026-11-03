import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import { getWeekState } from "../utils/week";

export default function Quiz({ week, onDone }) {
  const questions = useMemo(
    () => [...(week?.matchQuestions || []), ...(week?.playerQuestions || [])],
    [week]
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!week) {
    return <div className="empty">Nessuna settimana disponibile.</div>;
  }

  const state = getWeekState(week);

  if (state !== "open") {
    return <div className="empty">Questa settimana non è disponibile.</div>;
  }

  const question = questions[index];

  const choose = (answer) => {
    setAnswers({
      ...answers,
      [index]: answer,
    });

    setError("");
  };

  const previous = () => {
    if (index > 0) {
      setIndex(index - 1);
      setError("");
    }
  };

  const next = async () => {
    if (!answers[index]) {
      setError("Scegli una risposta.");
      return;
    }

    if (index === questions.length - 1) {
      const matchAnswers = questions.slice(0, 10).map((_, i) => answers[i] || "");

      const playerAnswers = questions
        .slice(10, 20)
        .map((_, i) => answers[i + 10] || "");

      setSubmitting(true);
      setError("");

      try {
        await onDone({ matchAnswers, playerAnswers });
      } catch (err) {
        setError(err.message || "Impossibile salvare le risposte.");
      } finally {
        setSubmitting(false);
      }

      return;
    }

    setIndex(index + 1);
  };

  return (
    <div className="wrap">
      <div className="progress">
        DOMANDA {index + 1} / {questions.length}

        <div>
          <i style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="quizCard">
        <div className="qtype">
          {index < 10 ? "DOMANDA PARTITA" : "DOMANDA GIOCATORE"}
        </div>

        <h2>{question?.text || "Domanda non ancora inserita"}</h2>

        <div className="answers">
          {(question?.options || ["A", "B", "C", "D"]).map((option, i) => (
            <button
              key={i}
              className={answers[index] === option ? "selected" : ""}
              onClick={() => choose(option)}
            >
              {String.fromCharCode(65 + i)}

              <span>{option || `Risposta ${i + 1}`}</span>
            </button>
          ))}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="quizNavigation">
          <button
            className="previousButton"
            onClick={previous}
            disabled={index === 0 || submitting}
          >
            <Icon name="arrow-left" size={16} />
            INDIETRO
          </button>

          <button className="next" onClick={next} disabled={submitting}>
            {submitting
              ? "SALVATAGGIO..."
              : index === questions.length - 1
              ? "VAI AI RIGORI"
              : "AVANTI"}

            {!submitting && <Icon name="arrow" size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
