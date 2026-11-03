import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import AnswerReview from "../components/AnswerReview";
import { dbAttempts } from "../services/attempts";

export default function Rank({ week, weeks, allAttempts, profile }) {
  const publishedWeeks = useMemo(
    () =>
      [...(weeks || [])]
        .filter((item) => item?.results_published === true)
        .sort((a, b) => Number(b.number || 0) - Number(a.number || 0)),
    [weeks]
  );

  const [selectedWeekId, setSelectedWeekId] = useState(
    week?.results_published ? week.id : publishedWeeks[0]?.id || ""
  );

  const [rankAttempts, setRankAttempts] = useState([]);
  const [rankError, setRankError] = useState("");
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [reviewWeek, setReviewWeek] = useState(null);

  useEffect(() => {
    const preferred = week?.results_published
      ? week.id
      : publishedWeeks[0]?.id || "";

    setSelectedWeekId((current) =>
      current && publishedWeeks.some((item) => item.id === current)
        ? current
        : preferred
    );
  }, [week?.id, week?.results_published, publishedWeeks]);

  const selectedWeek =
    publishedWeeks.find((item) => item.id === selectedWeekId) || null;

  useEffect(() => {
    if (!selectedWeek?.id) {
      setRankAttempts([]);
      return;
    }

    let cancelled = false;

    setRankError("");

    dbAttempts(selectedWeek.id)
      .then((data) => {
        if (!cancelled) {
          setRankAttempts(data || []);
        }
      })
      .catch((err) => {
        console.error(err);

        if (!cancelled) {
          setRankError("Impossibile aggiornare la classifica.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedWeek?.id]);

  const sourceAttempts = rankAttempts.length
    ? rankAttempts
    : (allAttempts || []).filter(
        (attempt) => attempt.week_id === selectedWeek?.id
      );

  const rows = [...sourceAttempts]
    .filter((attempt) => attempt.results_published === true)
    .sort((a, b) => Number(b.final_score || 0) - Number(a.final_score || 0));

  const myIndex = rows.findIndex(
    (attempt) => attempt.username === profile.username
  );

  const myPosition = myIndex >= 0 ? myIndex + 1 : null;

  const above = myIndex > 0 ? rows[myIndex - 1] : null;

  const myScore = myIndex >= 0 ? Number(rows[myIndex].final_score || 0) : 0;

  if (!publishedWeeks.length) {
    return (
      <div className="wrap">
        <div className="title">
          <small>FANTALUCK</small>

          <h1>Classifica</h1>
        </div>

        <div className="empty">
          <div className="bigEmoji">
            <Icon name="trophy" size={48} />
          </div>

          <h2>Risultati non ancora pubblicati</h2>

          <p>Non ci sono ancora settimane con risultati pubblicati.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="title">
        <small>FANTALUCK</small>

        <h1>Classifica</h1>

        <p className="rankingHint">
          Consulta la classifica e il resoconto di ogni partecipante.
        </p>
      </div>

      <div className="rankingWeekSelector">
        <label>
          <small>SETTIMANA</small>

          <select
            value={selectedWeekId}
            onChange={(e) => setSelectedWeekId(e.target.value)}
          >
            {publishedWeeks.map((item) => (
              <option key={item.id} value={item.id}>
                Settimana #{item.number}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedWeek && (
        <div className="rankingWeekHeading">
          <small>CLASSIFICA — SETTIMANA #{selectedWeek.number}</small>

          <strong>RISULTATI PUBBLICATI</strong>
        </div>
      )}

      {myPosition && (
        <div className="myRankCard">
          <div>
            <small>LA TUA POSIZIONE</small>

            <strong>#{myPosition}</strong>
          </div>

          <div>
            <small>PUNTEGGIO</small>

            <strong>{myScore}</strong>
          </div>

          {above && (
            <div>
              <small>DISTACCO</small>

              <strong>
                {Math.max(0, Number(above.final_score || 0) - myScore)}
              </strong>
            </div>
          )}
        </div>
      )}

      {rankError && <div className="error">{rankError}</div>}

      <div className="table rankingTable">
        {rows.map((attempt, index) => {
          const isMine = attempt.username === profile.username;

          return (
            <div
              className={
                isMine
                  ? "row currentPlayer rankingParticipantRow"
                  : "row rankingParticipantRow"
              }
              key={attempt.id || attempt.username}
            >
              <b className="rankingPosition">{index + 1}</b>

              <span>
                <strong>{attempt.name || attempt.username}</strong>

                <small>
                  {attempt.correct_answers || 0}/20 corrette ·{" "}
                  {attempt.goals || 0} gol
                </small>
              </span>

              <strong className="rankingScore">
                {attempt.final_score || 0}
              </strong>

              <button
                type="button"
                className="reviewOpenButton"
                onClick={() => {
                  setSelectedAttempt(attempt);
                  setReviewWeek(selectedWeek);
                }}
              >
                <span>VEDI RISPOSTE</span>

                <Icon name="eye" size={17} />
              </button>
            </div>
          );
        })}

        {!rows.length && (
          <div className="empty">
            Nessun risultato disponibile per questa settimana.
          </div>
        )}
      </div>

      {selectedAttempt && reviewWeek && (
        <AnswerReview
          week={reviewWeek}
          attempt={selectedAttempt}
          profile={profile}
          onClose={() => {
            setSelectedAttempt(null);
            setReviewWeek(null);
          }}
        />
      )}
    </div>
  );
}
