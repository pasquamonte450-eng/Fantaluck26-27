import { useState } from "react";
import Icon from "../components/Icon";
import AnswerReview from "../components/AnswerReview";

export default function History({ profile, attempts, weeks, setPage }) {
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);

  const weekNumber = (attempt) =>
    Number(weeks.find((week) => week.id === attempt.week_id)?.number || 0);

  const myAttempts = attempts
    .filter((attempt) => attempt.username === profile.username)
    .sort((a, b) => weekNumber(b) - weekNumber(a));

  return (
    <div className="wrap">
      <div className="title">
        <small>FANTALUCK</small>

        <h1>Storico</h1>

        <p className="rankingHint">Tutte le tue partecipazioni.</p>
      </div>

      <div className="historyList">
        {myAttempts.map((attempt) => {
          const week = weeks.find((item) => item.id === attempt.week_id);

          const canReview = Boolean(week && attempt);

          return (
            <div className="historyCard" key={attempt.id}>
              <div className="historyWeek">
                <small>SETTIMANA</small>

                <strong>#{week?.number ?? "?"}</strong>
              </div>

              <div className="historyMain">
                <strong>
                  {attempt.results_published
                    ? `${attempt.correct_answers || 0}/20 corrette`
                    : "Risultato in attesa"}
                </strong>

                <span>
                  {attempt.rigori_finished
                    ? `${attempt.goals || 0} gol · x${Number(
                        attempt.multiplier || 1
                      ).toFixed(2)}`
                    : "Rigori non completati"}
                </span>

                {canReview && (
                  <button
                    type="button"
                    className="historyReviewButton"
                    onClick={() => {
                      setSelectedAttempt(attempt);
                      setSelectedWeek(week);
                    }}
                  >
                    RIVEDI LE TUE RISPOSTE
                    <Icon name="arrow" size={16} />
                  </button>
                )}
              </div>

              <div className="historyScore">
                <small>PUNTEGGIO</small>

                <strong>
                  {attempt.results_published ? attempt.final_score || 0 : "—"}
                </strong>
              </div>
            </div>
          );
        })}

        {!myAttempts.length && (
          <div className="empty">
            Non hai ancora partecipato a nessuna settimana.
          </div>
        )}
      </div>

      <button className="backButton" onClick={() => setPage("profile")}>
        <Icon name="arrow-left" size={16} />
        TORNA AL PROFILO
      </button>

      {selectedAttempt && selectedWeek && (
        <AnswerReview
          week={selectedWeek}
          attempt={selectedAttempt}
          profile={profile}
          onClose={() => {
            setSelectedAttempt(null);
            setSelectedWeek(null);
          }}
        />
      )}
    </div>
  );
}
