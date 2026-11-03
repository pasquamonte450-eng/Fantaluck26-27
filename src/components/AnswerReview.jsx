import Icon from "./Icon";
import {
  countCorrect,
  getCorrectAnswers,
  isAnswerCorrect,
} from "../utils/questions";

export default function AnswerReview({ week, attempt, profile, onClose }) {
  const published = Boolean(week?.results_published);

  const questions = [
    ...(week?.matchQuestions || []),
    ...(week?.playerQuestions || []),
  ];

  const matchAnswers = Array.isArray(attempt?.match_answers)
    ? attempt.match_answers
    : [];

  const playerAnswers = Array.isArray(attempt?.player_answers)
    ? attempt.player_answers
    : [];

  const allAnswers = [...matchAnswers, ...playerAnswers];

  const isOwnAttempt = attempt?.username === profile?.username;

  const showCorrections = published;

  const getQuestionResult = (question, index) => {
    const given = allAnswers[index] || "";

    return {
      given,
      correctAnswers: getCorrectAnswers(question),
      correct: isAnswerCorrect(question, given),
    };
  };

  const renderQuestion = (question, index) => {
    const result = getQuestionResult(question, index);
    const hasGiven = Boolean(result.given);

    return (
      <div
        className="reviewQuestion"
        key={question?.id || `${index}-${question?.text}`}
      >
        <div className="reviewQuestionNumber">DOMANDA {index + 1}</div>

        <div className="reviewQuestionText">
          {question?.text || "Domanda non disponibile"}
        </div>

        <div className="reviewAnswerLine">
          <small>LA TUA RISPOSTA</small>

          <strong>{hasGiven ? result.given : "Nessuna risposta"}</strong>
        </div>

        {showCorrections ? (
          <>
            <div className="reviewAnswerLine">
              <small>RISPOSTA CORRETTA</small>

              <strong>
                {result.correctAnswers.length
                  ? result.correctAnswers.join(" / ")
                  : "Soluzione non disponibile"}
              </strong>
            </div>

            <div
              className={
                result.correct
                  ? "reviewOutcome correct"
                  : "reviewOutcome wrong"
              }
            >
              <span className="reviewOutcomeIcon">
                <Icon name={result.correct ? "check" : "x"} size={17} />
              </span>

              <strong>{result.correct ? "CORRETTA" : "SBAGLIATA"}</strong>

              <span>· +{result.correct ? 10 : 0}</span>
            </div>
          </>
        ) : (
          <div className="reviewPending">
            <Icon name="info" size={16} />

            <span>
              La soluzione sarà disponibile dopo la pubblicazione dei
              risultati.
            </span>
          </div>
        )}
      </div>
    );
  };

  const matchResults = questions.slice(0, 10);
  const playerResults = questions.slice(10, 20);

  const calculatedCorrect = published
    ? countCorrect(questions, allAnswers)
    : Number(attempt?.correct_answers || 0);

  const baseScore = published
    ? calculatedCorrect * 10
    : Number(attempt?.base_score || 0);

  const goals = Number(attempt?.goals || 0);
  const multiplier = Number(attempt?.multiplier || 1);
  const finalScore = Number(attempt?.final_score || 0);

  return (
    <div className="reviewOverlay">
      <div className="reviewModal">
        <div className="reviewHeader">
          <div>
            <small>FANTALUCK · SETTIMANA #{week?.number ?? "?"}</small>

            <h2>
              {isOwnAttempt
                ? "Le tue risposte"
                : `Risposte di ${
                    attempt?.name || attempt?.username || "giocatore"
                  }`}
            </h2>

            <span>
              {published
                ? "Risultati pubblicati"
                : "Risultati non ancora pubblicati"}
            </span>
          </div>

          <button
            className="reviewClose"
            onClick={onClose}
            aria-label="Chiudi"
          >
            <Icon name="close" size={21} />
          </button>
        </div>

        {!published && (
          <div className="reviewNotice">
            <Icon name="info" size={18} />

            <span>
              Puoi vedere le risposte date, ma la soluzione e l'esito restano
              nascosti fino alla pubblicazione dei risultati.
            </span>
          </div>
        )}

        <section className="reviewSection">
          <div className="reviewSectionTitle">
            <div>
              <small>01</small>
              <h3>MATCH</h3>
            </div>

            <span>10 DOMANDE</span>
          </div>

          <div className="reviewQuestions">
            {matchResults.map((question, index) =>
              renderQuestion(question, index)
            )}
          </div>
        </section>

        <section className="reviewSection">
          <div className="reviewSectionTitle">
            <div>
              <small>02</small>
              <h3>PLAYER</h3>
            </div>

            <span>10 DOMANDE</span>
          </div>

          <div className="reviewQuestions">
            {playerResults.map((question, index) =>
              renderQuestion(question, index + 10)
            )}
          </div>
        </section>

        <section className="reviewSummary">
          <div className="reviewSectionTitle">
            <div>
              <small>03</small>
              <h3>RIEPILOGO</h3>
            </div>
          </div>

          <div className="reviewSummaryGrid">
            <div>
              <small>RISPOSTE CORRETTE</small>

              <strong>{calculatedCorrect}/20</strong>
            </div>

            <div>
              <small>PUNTI QUIZ</small>

              <strong>{published ? baseScore : "—"}</strong>
            </div>

            <div>
              <small>RIGORI</small>

              <strong>{attempt?.rigori_finished ? goals : "—"}</strong>
            </div>

            <div>
              <small>MOLTIPLICATORE</small>

              <strong>
                {attempt?.rigori_finished ? `x${multiplier.toFixed(2)}` : "—"}
              </strong>
            </div>
          </div>

          <div className="reviewFinalScore">
            <small>PUNTEGGIO FINALE</small>

            <strong>{published ? finalScore : "—"}</strong>
          </div>
        </section>

        <button className="reviewBackButton" onClick={onClose}>
          CHIUDI RESOCONTO
        </button>
      </div>
    </div>
  );
}
