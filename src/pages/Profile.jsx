import Icon from "../components/Icon";

const sumBy = (list, field) =>
  list.reduce((sum, attempt) => sum + Number(attempt[field] || 0), 0);

export default function Profile({ profile, attempts, allWeeks, setPage }) {
  const myAttempts = attempts.filter(
    (attempt) => attempt.username === profile.username
  );

  const completedAttempts = myAttempts.filter(
    (attempt) => attempt.rigori_finished
  );

  const publishedAttempts = completedAttempts.filter(
    (attempt) => attempt.results_published
  );

  const totalCorrect = sumBy(publishedAttempts, "correct_answers");

  const totalGoals = sumBy(completedAttempts, "goals");

  const bestScore = publishedAttempts.length
    ? Math.max(
        ...publishedAttempts.map((attempt) => Number(attempt.final_score || 0))
      )
    : 0;

  const average = publishedAttempts.length
    ? (sumBy(publishedAttempts, "final_score") / publishedAttempts.length).toFixed(1)
    : "0.0";

  const totalQuestions = publishedAttempts.length * 20;

  const accuracy = totalQuestions
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0;

  return (
    <div className="wrap">
      <div className="title">
        <small>FANTALUCK</small>

        <h1>Il tuo profilo</h1>

        <p className="rankingHint">Le tue statistiche.</p>
      </div>

      {profile.blocked && (
        <div className="blockedBanner">
          <div>
            <strong>ACCOUNT BLOCCATO</strong>

            <span>La consultazione del profilo resta disponibile.</span>
          </div>
        </div>
      )}

      <div className="profileHero">
        <div className="profileAvatar">
          <Icon name="user" size={36} />
        </div>

        <div>
          <small>GIOCATORE</small>

          <h2>{profile.name}</h2>

          <span>@{profile.username}</span>
        </div>
      </div>

      <div className="statsGrid">
        <div className="statCard">
          <small>SETTIMANE</small>

          <strong>{completedAttempts.length}</strong>

          <span>partecipate</span>
        </div>

        <div className="statCard">
          <small>CORRETTE</small>

          <strong>{totalCorrect}</strong>

          <span>{accuracy}% precisione</span>
        </div>

        <div className="statCard">
          <small>RIGORI</small>

          <strong>{totalGoals}</strong>

          <span>gol segnati</span>
        </div>

        <div className="statCard">
          <small>MIGLIOR RISULTATO</small>

          <strong>{bestScore}</strong>

          <span>punti</span>
        </div>
      </div>

      <div className="profileStatsCard">
        <div>
          <small>MEDIA PUNTEGGIO</small>

          <strong>{average}</strong>
        </div>

        <div>
          <small>PRONOSTICI</small>

          <strong>{Number(profile.pronostici_indovinati || 0)}</strong>
        </div>

        <div>
          <small>SETTIMANE DISPONIBILI</small>

          <strong>{allWeeks.length}</strong>
        </div>
      </div>

      <div className="profileNavigation">
        <button
          className="profileNavigationCard"
          onClick={() => setPage("history")}
        >
          <div className="profileNavigationIcon">
            <Icon name="trophy" size={20} />
          </div>

          <div className="profileNavigationText">
            <small>STORICO</small>

            <strong>LE MIE PARTECIPAZIONI</strong>
          </div>

          <span className="profileNavigationArrow">
            <Icon name="arrow" size={18} />
          </span>
        </button>

        <button
          className="profileNavigationCard"
          onClick={() => setPage("pronostici")}
        >
          <div className="profileNavigationIcon">
            <Icon name="target" size={20} />
          </div>

          <div className="profileNavigationText">
            <small>CLASSIFICA</small>

            <strong>PRONOSTICI INDOVINATI</strong>
          </div>

          <span className="profileNavigationArrow">
            <Icon name="arrow" size={18} />
          </span>
        </button>
      </div>
    </div>
  );
}
