import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabase";
import "./styles.css";

/* =========================================================
   FANTALUCK — La sfida settimanale
   ========================================================= */

const EMAIL_DOMAIN = "fantaluck.local";

/*
  LOGIN:
  - se inserisci un'email, viene usata direttamente
  - se inserisci uno username, viene trasformato in
    username@fantaluck.local
*/
const toAuthEmail = (username) => {
  const value = username.trim().toLowerCase();

  return value.includes("@")
    ? value
    : `${value}@${EMAIL_DOMAIN}`;
};

const EMPTY_OPTIONS = ["", "", "", ""];

const makeQuestion = (type, index) => ({
  id: `${type}-${index + 1}-${Date.now()}`,
  text: "",
  options: [...EMPTY_OPTIONS],
  correct: [],
});

const makeQuestions = (type) =>
  Array.from({ length: 10 }, (_, i) => makeQuestion(type, i));

const newWeek = (number) => ({
  id: `week-${number}-${Date.now()}`,
  number,
  status: "draft",
  starts_at: "",
  deadline: "",
  matchQuestions: makeQuestions("match"),
  playerQuestions: makeQuestions("player"),
  rigoriCells: 12,
  multiplierBase: 1,
  multiplierStep: 0.15,
  results_published: false,
});

/* =========================================================
   HELPERS
   ========================================================= */

function uid() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function getCorrectAnswers(question) {
  if (Array.isArray(question?.correct)) {
    return question.correct.filter(Boolean);
  }

  if (question?.correct) {
    return [question.correct];
  }

  return [];
}

function normalizeQuestion(question, type, index) {
  return {
    ...question,
    id: question?.id || `${type}-${index + 1}-${Date.now()}`,
    text: question?.text || "",
    options: Array.from(
      { length: 4 },
      (_, i) => question?.options?.[i] || ""
    ),
    correct: getCorrectAnswers(question),
  };
}

function normalizeWeek(week) {
  return {
    ...week,
    matchQuestions: Array.from({ length: 10 }, (_, i) =>
      normalizeQuestion(week?.matchQuestions?.[i], "match", i)
    ),
    playerQuestions: Array.from({ length: 10 }, (_, i) =>
      normalizeQuestion(week?.playerQuestions?.[i], "player", i)
    ),
  };
}

function toDateTimeLocalValue(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
}

function getWeekState(week) {
  if (!week) return "none";

  const now = Date.now();

  const start = week.starts_at
    ? new Date(week.starts_at).getTime()
    : null;

  const end = week.deadline
    ? new Date(week.deadline).getTime()
    : null;

  if (week.status === "closed") return "closed";

  if (week.status === "published") return "published";

  if (start && now < start) return "waiting";

  if (end && now > end) return "closed";

  if (week.status === "open") return "open";

  return "draft";
}

function goalsAvailableForShot(shotNumber) {
  const pair = Math.floor(shotNumber / 2);

  return Math.max(2, 11 - pair);
}

/* =========================================================
   EDGE FUNCTIONS
   ========================================================= */

async function callFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, {
    body,
  });

  if (error) {
    let message = error.message || "Errore di rete.";

    try {
      const parsed = await error.context?.json?.();

      if (parsed?.error) {
        message = parsed.error;
      }
    } catch {
      // Usiamo il messaggio di default.
    }

    throw new Error(message);
  }

  return data;
}

/* =========================================================
   DATABASE
   ========================================================= */

async function dbProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return data;
}

async function dbAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("username");

  if (error) throw error;

  return data || [];
}

async function dbWeeksPublic() {
  const { data, error } = await supabase
    .from("weeks_public")
    .select("*")
    .order("number", { ascending: true });

  if (error) throw error;

  return data || [];
}

async function dbWeeksAdmin() {
  const { data, error } = await supabase
    .from("weeks")
    .select("*")
    .order("number", { ascending: true });

  if (error) throw error;

  return data || [];
}

async function saveWeek(week) {
  const { error } = await supabase
    .from("weeks")
    .upsert(week, { onConflict: "id" });

  if (error) throw error;
}

async function deleteWeek(id) {
  const { error } = await supabase
    .from("weeks")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

async function dbAttempts(weekId) {
  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("week_id", weekId);

  if (error) throw error;

  return data || [];
}

async function updateAttempt(id, values) {
  const { error } = await supabase
    .from("attempts")
    .update(values)
    .eq("id", id);

  if (error) throw error;
}

/* =========================================================
   COUNTDOWN
   ========================================================= */

function Countdown({ week }) {
  const state = getWeekState(week);

  const target =
    state === "waiting"
      ? week?.starts_at
      : state === "open"
        ? week?.deadline
        : null;

  const [remaining, setRemaining] = useState(() =>
    target
      ? Math.max(0, new Date(target).getTime() - Date.now())
      : 0
  );

  useEffect(() => {
    if (!target) {
      setRemaining(0);
      return;
    }

    const update = () => {
      setRemaining(
        Math.max(
          0,
          new Date(target).getTime() - Date.now()
        )
      );
    };

    update();

    const timer = setInterval(update, 1000);

    return () => clearInterval(timer);
  }, [target]);

  if (!target || (state !== "waiting" && state !== "open")) {
    return null;
  }

  const totalSeconds = Math.floor(remaining / 1000);

  const days = Math.floor(totalSeconds / 86400);

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  return (
    <div className="countdownCard">
      <div className="countdownLabel">
        <span className="countdownDot" />

        {state === "waiting"
          ? "LA SFIDA INIZIA TRA"
          : "PUOI GIOCARE FINO A"}
      </div>

      <div className="countdownNumbers">
        <div>
          <strong>{String(days).padStart(2, "0")}</strong>
          <small>GIORNI</small>
        </div>

        <b>:</b>

        <div>
          <strong>{String(hours).padStart(2, "0")}</strong>
          <small>ORE</small>
        </div>

        <b>:</b>

        <div>
          <strong>{String(minutes).padStart(2, "0")}</strong>
          <small>MIN</small>
        </div>

        <b>:</b>

        <div>
          <strong>{String(seconds).padStart(2, "0")}</strong>
          <small>SEC</small>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   LOGIN
   ========================================================= */

function Login({ onLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError("Inserisci username e password.");
      return;
    }

    setLoading(true);

    const { data, error: authError } =
      await supabase.auth.signInWithPassword({
        email: toAuthEmail(username),
        password,
      });

    setLoading(false);

    if (authError || !data?.user) {
      setError("Username o password non validi.");
      return;
    }

    onLoggedIn();
  };

  return (
    <main className="login">
      <div className="loginCard">
        <div className="logo">🍀 FANTALUCK</div>

        <p className="tag">
          LA SFIDA SETTIMANALE
        </p>

        <form onSubmit={submit}>
          <input
            placeholder="Username o email"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            autoComplete="username"
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "ACCESSO..." : "ENTRA"}
          </button>
        </form>

        {error && (
          <div className="error">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function Nav({
  page,
  setPage,
  profile,
  onLogout,
}) {
  return (
    <nav>
      <button
        className={page === "home" ? "active" : ""}
        onClick={() => setPage("home")}
      >
        🏠
        <span>Home</span>
      </button>

      <button
        className={page === "quiz" ? "active" : ""}
        onClick={() => setPage("quiz")}
      >
        ⚽
        <span>Gioca</span>
      </button>

      <button
        className={page === "rank" ? "active" : ""}
        onClick={() => setPage("rank")}
      >
        🏆
        <span>Classifica</span>
      </button>

      {profile.role === "admin" && (
        <button
          className={
            page === "admin" ? "active" : ""
          }
          onClick={() => setPage("admin")}
        >
          ⚙️
          <span>Admin</span>
        </button>
      )}

      <button onClick={onLogout}>
        ↪
        <span>Esci</span>
      </button>
    </nav>
  );
}

/* =========================================================
   HOME
   ========================================================= */

function Home({
  week,
  profile,
  setPage,
  attempt,
}) {
  const state = getWeekState(week);

  const [rulesOpen, setRulesOpen] =
    useState(false);

  return (
    <div className="wrap">
      <section className="hero">
        <div className="badge">
          🍀 FANTALUCK
        </div>

        <h1>
          La sfida
          <br />
          <em>settimanale.</em>
        </h1>

        <p>
          Conosci il calcio. Indovina. Segna.
        </p>

        {state === "open" && !attempt && (
          <button
            onClick={() => setPage("quiz")}
          >
            GIOCA ORA →
          </button>
        )}

        {state === "waiting" && (
          <div className="notice">
            La nuova sfida non è ancora
            iniziata.
          </div>
        )}

        {state === "closed" &&
          !week?.results_published && (
            <div className="notice">
              La settimana è chiusa.
              <br />
              I risultati saranno pubblicati
              dall'organizzatore.
            </div>
          )}

        {attempt &&
          !week?.results_published && (
            <div className="notice">
              Hai già partecipato.
              <br />
              Il risultato sarà disponibile
              dopo la pubblicazione.
            </div>
          )}

        {week?.results_published && (
          <button
            onClick={() => setPage("rank")}
          >
            VEDI RISULTATI →
          </button>
        )}
      </section>

      <div className="grid2">
        <div className="card">
          <small>SETTIMANA</small>

          <strong>
            #{week?.number ?? "-"}
          </strong>

          <span>
            {state === "open" && "APERTA"}
            {state === "waiting" &&
              "IN ARRIVO"}
            {state === "closed" && "CHIUSA"}
            {state === "published" &&
              "RISULTATI PUBBLICATI"}
            {state === "draft" &&
              "IN PREPARAZIONE"}
            {state === "none" && "NESSUNA"}
          </span>
        </div>

        <div className="card">
          <small>IL TUO PROFILO</small>

          <strong>
            {profile.name}
          </strong>

          <span>
            @{profile.username}
          </span>
        </div>
      </div>

      <Countdown week={week} />

      <button
        className="rulesToggle"
        onClick={() =>
          setRulesOpen(!rulesOpen)
        }
      >
        <span>
          <small>FANTALUCK</small>
          <strong>REGOLAMENTO</strong>
        </span>

        <span
          className={
            rulesOpen
              ? "rulesArrow open"
              : "rulesArrow"
          }
        >
          ↓
        </span>
      </button>

      {rulesOpen && (
        <div className="rulesCard">
          <div className="rulesList">
            <div className="ruleItem">
              <b>01</b>
              <span>
                20 domande: 10 sulle partite
                e 10 sui giocatori.
              </span>
            </div>

            <div className="ruleItem">
              <b>02</b>
              <span>
                Ogni risposta corretta vale
                10 punti.
              </span>
            </div>

            <div className="ruleItem">
              <b>03</b>
              <span>
                Terminato il quiz si passa
                alla sfida dei rigori.
              </span>
            </div>

            <div className="ruleItem">
              <b>04</b>
              <span>
                Ogni rigore ha 12 caselle.
                La possibilità di segnare
                diminuisce ogni 2 rigori,
                fino a un minimo di 2/12.
              </span>
            </div>

            <div className="ruleItem">
              <b>05</b>
              <span>
                Il moltiplicatore parte da
                x1.00 e aumenta di 0.15 per
                ogni gol.
              </span>
            </div>

            <div className="ruleItem">
              <b>06</b>
              <span>
                Un rigore parato interrompe
                la serie.
              </span>
            </div>

            <div className="ruleItem">
              <b>07</b>
              <span>
                Il punteggio finale è il
                punteggio del quiz moltiplicato
                per il moltiplicatore.
              </span>
            </div>

            <div className="ruleItem">
              <b>08</b>
              <span>
                Se una domanda ha più risposte
                corrette, è sufficiente scegliere
                una delle alternative valide.
              </span>
            </div>

            <div className="ruleItem">
              <b>09</b>
              <span>
                I risultati vengono pubblicati
                dall'organizzatore dopo la
                chiusura della settimana.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   QUIZ
   ========================================================= */

function Quiz({ week, onDone }) {
  const questions = useMemo(
    () => [
      ...(week?.matchQuestions || []),
      ...(week?.playerQuestions || []),
    ],
    [week]
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] =
    useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  if (!week) {
    return (
      <div className="empty">
        Nessuna settimana disponibile.
      </div>
    );
  }

  const state = getWeekState(week);

  if (state !== "open") {
    return (
      <div className="empty">
        Questa settimana non è disponibile.
      </div>
    );
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
      const matchAnswers =
        questions
          .slice(0, 10)
          .map(
            (_, i) =>
              answers[i] || ""
          );

      const playerAnswers =
        questions
          .slice(10, 20)
          .map(
            (_, i) =>
              answers[i + 10] || ""
          );

      setSubmitting(true);
      setError("");

      try {
        await onDone({
          matchAnswers,
          playerAnswers,
        });
      } catch (err) {
        setError(
          err.message ||
            "Impossibile salvare le risposte."
        );
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
          <i
            style={{
              width: `${
                ((index + 1) /
                  questions.length) *
                100
              }%`,
            }}
          />
        </div>
      </div>

      <div className="quizCard">
        <div className="qtype">
          {index < 10
            ? "DOMANDA PARTITA"
            : "DOMANDA GIOCATORE"}
        </div>

        <h2>
          {question?.text ||
            "Domanda non ancora inserita"}
        </h2>

        <div className="answers">
          {(
            question?.options || [
              "A",
              "B",
              "C",
              "D",
            ]
          ).map((option, i) => (
            <button
              key={i}
              className={
                answers[index] === option
                  ? "selected"
                  : ""
              }
              onClick={() =>
                choose(option)
              }
            >
              {String.fromCharCode(
                65 + i
              )}

              <span>
                {option ||
                  `Risposta ${i + 1}`}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <div className="quizNavigation">
          <button
            className="previousButton"
            onClick={previous}
            disabled={
              index === 0 || submitting
            }
          >
            ← INDIETRO
          </button>

          <button
            className="next"
            onClick={next}
            disabled={submitting}
          >
            {submitting
              ? "SALVATAGGIO..."
              : index ===
                  questions.length - 1
                ? "VAI AI RIGORI"
                : "AVANTI →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   RIGORI
   La Edge Function deployata si chiama "rigori"
   ========================================================= */

function Rigori({ week, onDone }) {
  const [shot, setShot] = useState(0);
  const [goals, setGoals] = useState(0);
  const [multiplier, setMultiplier] =
    useState(1);
  const [selected, setSelected] =
    useState(null);
  const [result, setResult] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const status =
          await callFunction("rigori", {
            week_id: week.id,
            action: "status",
          });

        if (cancelled) return;

        if (status.finished) {
          onDone();
          return;
        }

        setShot(
          status.shotNumber || 0
        );

        setGoals(
          status.goals || 0
        );

        setMultiplier(
          Number(
            status.multiplier || 1
          )
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Errore di connessione."
          );
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week.id]);

  const shoot = async (cell) => {
    if (busy || result) return;

    setBusy(true);
    setError("");
    setSelected(cell);

    try {
      const response =
        await callFunction("rigori", {
          week_id: week.id,
          cell,
        });

      setResult({
        goal: response.goal,
        multiplier:
          response.multiplier,
      });

      setGoals(response.goals);

      setMultiplier(
        response.multiplier
      );
    } catch (err) {
      setError(
        err.message ||
          "Errore di connessione."
      );

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
    return (
      <div className="empty">
        Caricamento rigori...
      </div>
    );
  }

  const goalCount =
    goalsAvailableForShot(shot);

  return (
    <div className="wrap">
      <div className="penalty">
        <div className="penaltyTop">
          <span>RIGORI</span>
          <strong>
            {shot + 1}° RIGORE
          </strong>
        </div>

        <div className="keeper">
          🧤
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
          <span>
            possibilità di segnare
          </span>
        </div>

        <div className="goalGrid">
          {Array.from(
            { length: 12 },
            (_, cell) => (
              <button
                key={cell}
                disabled={
                  Boolean(result) || busy
                }
                className={
                  selected === cell
                    ? "selectedCell"
                    : ""
                }
                onClick={() =>
                  shoot(cell)
                }
              >
                {cell + 1}
              </button>
            )
          )}
        </div>

        <div className="mult">
          <small>
            MOLTIPLICATORE
          </small>

          <strong>
            x{multiplier.toFixed(2)}
          </strong>

          <span>
            Gol: {goals}
          </span>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {result && (
          <div
            className={
              result.goal
                ? "shotResult goalResult"
                : "shotResult missResult"
            }
          >
            <div className="resultIcon">
              {result.goal
                ? "⚽"
                : "🧤"}
            </div>

            <h2>
              {result.goal
                ? "GOOOOL!"
                : "PARATO!"}
            </h2>

            <p>
              {result.goal
                ? "Continua la serie!"
                : "La serie termina qui."}
            </p>

            <button
              onClick={continueShot}
            >
              {result.goal
                ? "PROSSIMO RIGORE →"
                : "CONTINUA →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PARTICIPATION COMPLETE
   ========================================================= */

function Completed({ setPage }) {
  return (
    <div className="wrap">
      <div className="completedCard">
        <div className="completedIcon">
          🍀
        </div>

        <h1>
          Partecipazione registrata!
        </h1>

        <p>
          Le tue risposte e il risultato
          dei rigori sono stati salvati.
        </p>

        <p>
          Il punteggio sarà calcolato e
          pubblicato dall'organizzatore
          dopo la chiusura della settimana.
        </p>

        <button
          onClick={() =>
            setPage("home")
          }
        >
          TORNA ALLA HOME
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   ANSWER REVIEW
   ========================================================= */

function AnswerReview({
  week,
  attempt,
  onClose,
}) {
  const matchQuestions =
    week?.matchQuestions || [];

  const playerQuestions =
    week?.playerQuestions || [];

  const matchAnswers =
    attempt?.match_answers || [];

  const playerAnswers =
    attempt?.player_answers || [];

  const renderQuestion = (
    question,
    answer,
    index
  ) => {
    const correctAnswers =
      getCorrectAnswers(question);

    const isCorrect = Boolean(
      answer &&
        correctAnswers.includes(answer)
    );

    return (
      <div
        className={
          isCorrect
            ? "reviewQuestion reviewCorrect"
            : "reviewQuestion reviewWrong"
        }
        key={
          question?.id || index
        }
      >
        <div className="reviewQuestionTop">
          <span>
            DOMANDA {index + 1}
          </span>

          <strong>
            {isCorrect
              ? "✓ CORRETTA"
              : "✕ ERRATA"}
          </strong>
        </div>

        <h3>
          {question?.text ||
            "Domanda"}
        </h3>

        <div className="reviewAnswer">
          <small>
            LA TUA RISPOSTA
          </small>

          <strong>
            {answer ||
              "Nessuna risposta"}
          </strong>
        </div>

        <div className="reviewCorrectAnswer">
          <small>
            RISPOSTA CORRETTA
          </small>

          <strong>
            {correctAnswers.length
              ? correctAnswers.join(
                  " / "
                )
              : "Non disponibile"}
          </strong>
        </div>
      </div>
    );
  };

  return (
    <div
      className="reviewOverlay"
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="reviewModal">
        <div className="reviewHeader">
          <div>
            <small>
              FANTALUCK · SETTIMANA #
              {week?.number}
            </small>

            <h2>
              La tua partecipazione
            </h2>
          </div>

          <button
            className="reviewClose"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="reviewSummary">
          <div>
            <small>
              RISPOSTE CORRETTE
            </small>

            <strong>
              {attempt?.correct_answers ??
                0}
              /20
            </strong>
          </div>

          <div>
            <small>
              MOLTIPLICATORE
            </small>

            <strong>
              x
              {Number(
                attempt?.multiplier || 1
              ).toFixed(2)}
            </strong>
          </div>

          <div>
            <small>
              PUNTEGGIO FINALE
            </small>

            <strong>
              {attempt?.final_score ||
                0}
            </strong>
          </div>
        </div>

        <section className="reviewSection">
          <h3>
            ⚽ DOMANDE PARTITA
          </h3>

          {matchQuestions.map(
            (q, i) =>
              renderQuestion(
                q,
                matchAnswers[i],
                i
              )
          )}
        </section>

        <section className="reviewSection">
          <h3>
            👤 DOMANDE GIOCATORE
          </h3>

          {playerQuestions.map(
            (q, i) =>
              renderQuestion(
                q,
                playerAnswers[i],
                i
              )
          )}
        </section>

        <button
          className="reviewBottomClose"
          onClick={onClose}
        >
          CHIUDI REVISIONE
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   RANKING
   ========================================================= */

function Rank({
  week,
  attempts,
  profile,
}) {
  const [reviewOpen, setReviewOpen] =
    useState(false);

  if (!week?.results_published) {
    return (
      <div className="wrap">
        <div className="title">
          <small>FANTALUCK</small>
          <h1>Classifica</h1>
        </div>

        <div className="empty">
          <div className="bigEmoji">
            🏆
          </div>

          <h2>
            Risultati non ancora pubblicati
          </h2>

          <p>
            L'organizzatore deve prima
            correggere le risposte e
            pubblicare i risultati.
          </p>
        </div>
      </div>
    );
  }

  const rows = [...attempts].sort(
    (a, b) =>
      Number(b.final_score || 0) -
      Number(a.final_score || 0)
  );

  const myAttempt = attempts.find(
    (a) =>
      a.username === profile.username
  );

  return (
    <div className="wrap">
      <div className="title">
        <small>
          SETTIMANA #{week.number}
        </small>

        <h1>Classifica</h1>
      </div>

      <div className="table">
        {rows.map(
          (attempt, index) => {
            const isMine =
              attempt.username ===
              profile.username;

            return (
              <div
                className={
                  isMine
                    ? "row currentPlayer clickableRow"
                    : "row"
                }
                key={attempt.username}
                onClick={() => {
                  if (isMine) {
                    setReviewOpen(true);
                  }
                }}
              >
                <b>{index + 1}</b>

                <span>
                  <strong>
                    {attempt.name ||
                      attempt.username}
                  </strong>

                  <small>
                    {attempt.correct_answers ||
                      0}
                    /20 corrette ·{" "}
                    {attempt.goals || 0} gol
                  </small>

                  {isMine && (
                    <em>
                      CLICCA PER RIVEDERE
                      LE RISPOSTE
                    </em>
                  )}
                </span>

                <strong>
                  {attempt.final_score ||
                    0}
                </strong>
              </div>
            );
          }
        )}

        {!rows.length && (
          <div className="empty">
            Nessun risultato disponibile.
          </div>
        )}
      </div>

      {reviewOpen && myAttempt && (
        <AnswerReview
          week={week}
          attempt={myAttempt}
          onClose={() =>
            setReviewOpen(false)
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   ADMIN — QUESTION EDITOR
   ========================================================= */

function QuestionEditor({
  title,
  questions,
  onChange,
}) {
  const updateQuestion = (
    index,
    field,
    value
  ) => {
    const next = [...questions];

    next[index] = {
      ...next[index],
      [field]: value,
    };

    onChange(next);
  };

  const updateOption = (
    questionIndex,
    optionIndex,
    value
  ) => {
    const next = [...questions];

    const currentQuestion =
      next[questionIndex];

    const options = [
      ...(currentQuestion.options || []),
    ];

    const oldValue =
      options[optionIndex];

    options[optionIndex] = value;

    let correct =
      getCorrectAnswers(
        currentQuestion
      );

    if (
      oldValue &&
      correct.includes(oldValue)
    ) {
      correct = value
        ? correct.map((item) =>
            item === oldValue
              ? value
              : item
          )
        : correct.filter(
            (item) =>
              item !== oldValue
          );
    }

    correct = [
      ...new Set(
        correct.filter(Boolean)
      ),
    ];

    next[questionIndex] = {
      ...currentQuestion,
      options,
      correct,
    };

    onChange(next);
  };

  const toggleCorrect = (
    questionIndex,
    option
  ) => {
    const next = [...questions];

    const question =
      next[questionIndex];

    const current =
      getCorrectAnswers(question);

    const exists =
      current.includes(option);

    const correct = exists
      ? current.filter(
          (item) => item !== option
        )
      : [...current, option];

    next[questionIndex] = {
      ...question,
      correct,
    };

    onChange(next);
  };

  return (
    <div className="questionSection">
      <h2>{title}</h2>

      {questions.map(
        (question, index) => {
          const correctAnswers =
            getCorrectAnswers(
              question
            );

          return (
            <div
              className="questionEditor"
              key={question.id}
            >
              <div className="questionNumber">
                DOMANDA {index + 1}
              </div>

              <textarea
                placeholder="Scrivi la domanda..."
                value={
                  question.text || ""
                }
                onChange={(e) =>
                  updateQuestion(
                    index,
                    "text",
                    e.target.value
                  )
                }
              />

              <div className="optionGrid">
                {Array.from(
                  { length: 4 },
                  (_, optionIndex) => (
                    <input
                      key={optionIndex}
                      placeholder={`Risposta ${String.fromCharCode(
                        65 + optionIndex
                      )}`}
                      value={
                        question
                          .options?.[
                          optionIndex
                        ] || ""
                      }
                      onChange={(e) =>
                        updateOption(
                          index,
                          optionIndex,
                          e.target.value
                        )
                      }
                    />
                  )
                )}
              </div>

              <div className="correctAnswersEditor">
                <div className="correctAnswersTitle">
                  RISPOSTE CORRETTE
                </div>

                <p>
                  Puoi selezionare anche
                  più alternative.
                </p>

                <div className="correctCheckboxes">
                  {question.options
                    ?.filter(Boolean)
                    .map(
                      (
                        option,
                        optionIndex
                      ) => {
                        const checked =
                          correctAnswers.includes(
                            option
                          );

                        return (
                          <label
                            className={
                              checked
                                ? "correctCheckbox checked"
                                : "correctCheckbox"
                            }
                            key={`${question.id}-${optionIndex}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                toggleCorrect(
                                  index,
                                  option
                                )
                              }
                            />

                            <span>
                              {String.fromCharCode(
                                65 +
                                  optionIndex
                              )}{" "}
                              — {option}
                            </span>
                          </label>
                        );
                      }
                    )}
                </div>

                {!question.options?.some(
                  Boolean
                ) && (
                  <div className="noCorrectAnswer">
                    Inserisci prima le
                    alternative.
                  </div>
                )}

                {correctAnswers.length >
                  0 && (
                  <div className="selectedCorrectInfo">
                    Corrette:{" "}
                    {correctAnswers.join(
                      " / "
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

/* =========================================================
   ADMIN
   ========================================================= */

function Admin({
  weeks,
  setWeeks,
  reloadWeeks,
}) {
  const [tab, setTab] =
    useState("weeks");

  const [selectedWeekId, setSelectedWeekId] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [editingWeek, setEditingWeek] =
    useState(null);

  const [attempts, setAttempts] =
    useState([]);

  const [participants, setParticipants] =
    useState([]);

  const [userForm, setUserForm] =
    useState({
      username: "",
      name: "",
      password: "",
    });

  const [userBusy, setUserBusy] =
    useState(false);

  const [userError, setUserError] =
    useState("");

  const reloadParticipants = () =>
    dbAllProfiles()
      .then(setParticipants)
      .catch(console.error);

  useEffect(() => {
    if (tab === "users") {
      reloadParticipants();
    }
  }, [tab]);

  const addUser = async (event) => {
    event.preventDefault();

    setUserError("");

    if (
      !userForm.username.trim() ||
      !userForm.name.trim() ||
      !userForm.password
    ) {
      setUserError(
        "Compila tutti i campi."
      );

      return;
    }

    setUserBusy(true);

    try {
      await callFunction(
        "creazioneutente",
        {
          username:
            userForm.username.trim(),
          name:
            userForm.name.trim(),
          password:
            userForm.password,
        }
      );

      setUserForm({
        username: "",
        name: "",
        password: "",
      });

      await reloadParticipants();
    } catch (err) {
      setUserError(
        err.message ||
          "Impossibile creare il giocatore."
      );
    } finally {
      setUserBusy(false);
    }
  };

  const removeUser = async (
    username
  ) => {
    if (
      !window.confirm(
        "Vuoi eliminare questo giocatore?"
      )
    ) {
      return;
    }

    try {
      await callFunction(
        "togliutente",
        { username }
      );

      await reloadParticipants();
    } catch (err) {
      alert(
        err.message ||
          "Impossibile eliminare il giocatore."
      );
    }
  };

  const selectedWeek = weeks.find(
    (w) => w.id === selectedWeekId
  );

  const createNewWeek = () => {
    const highest =
      weeks.length > 0
        ? Math.max(
            ...weeks.map(
              (w) =>
                Number(w.number) || 0
            )
          )
        : 0;

    const week =
      newWeek(highest + 1);

    setEditingWeek(week);
    setSelectedWeekId(week.id);
    setTab("editWeek");
  };

  const saveCurrentWeek = async () => {
    if (!editingWeek) return;

    setSaving(true);
    setMessage("");

    try {
      const normalizedWeek =
        normalizeWeek(editingWeek);

      await saveWeek(
        normalizedWeek
      );

      await reloadWeeks();

      setEditingWeek(
        normalizedWeek
      );

      setMessage(
        "Settimana salvata correttamente."
      );
    } catch (err) {
      console.error(err);

      setMessage(
        "Errore durante il salvataggio."
      );
    } finally {
      setSaving(false);
    }
  };

  const editWeek = (week) => {
    setEditingWeek(
      normalizeWeek(week)
    );

    setSelectedWeekId(week.id);

    setTab("editWeek");
  };

  const removeWeek = async (
    week
  ) => {
    if (
      !window.confirm(
        `Eliminare la Settimana #${week.number}?`
      )
    ) {
      return;
    }

    await deleteWeek(week.id);

    await reloadWeeks();

    if (
      selectedWeekId === week.id
    ) {
      setSelectedWeekId(null);
      setEditingWeek(null);
    }
  };

  const toggleWeek = async (
    week
  ) => {
    const current =
      getWeekState(week);

    const nextStatus =
      current === "open"
        ? "closed"
        : "open";

    await saveWeek({
      ...week,
      status: nextStatus,
    });

    await reloadWeeks();
  };

  const openResults = async (
    week
  ) => {
    setSelectedWeekId(week.id);

    const data =
      await dbAttempts(week.id);

    setAttempts(data);

    setTab("results");
  };

  const allAnswersInserted = (
    week
  ) => {
    const questions = [
      ...(week.matchQuestions || []),
      ...(week.playerQuestions || []),
    ];

    return (
      questions.length === 20 &&
      questions.every(
        (q) =>
          getCorrectAnswers(q)
            .length > 0
      )
    );
  };

  const calculateAndPublish =
    async (week) => {
      if (
        !allAnswersInserted(week)
      ) {
        alert(
          "Inserisci almeno una risposta corretta per tutte le 20 domande prima di pubblicare."
        );

        return;
      }

      const currentAttempts =
        await dbAttempts(week.id);

      if (!currentAttempts.length) {
        alert(
          "Nessun giocatore ha ancora partecipato."
        );

        return;
      }

      const notFinished =
        currentAttempts.filter(
          (a) => !a.rigori_finished
        );

      if (notFinished.length) {
        const proceed =
          window.confirm(
            `${notFinished.length} giocatore/i non ha ancora terminato i rigori. Vuoi pubblicare comunque escludendo loro dal calcolo del punteggio?`
          );

        if (!proceed) return;
      }

      const allQuestions = [
        ...(week.matchQuestions || []),
        ...(week.playerQuestions || []),
      ];

      for (
        const attempt of currentAttempts
      ) {
        if (!attempt.rigori_finished) {
          continue;
        }

        const answers = [
          ...(attempt.match_answers || []),
          ...(attempt.player_answers || []),
        ];

        let correct = 0;

        allQuestions.forEach(
          (question, i) => {
            const correctAnswers =
              getCorrectAnswers(
                question
              );

            if (
              correctAnswers.length &&
              answers[i] &&
              correctAnswers.includes(
                answers[i]
              )
            ) {
              correct++;
            }
          }
        );

        const baseScore =
          correct * 10;

        const multiplier =
          Number(
            attempt.multiplier || 1
          );

        const finalScore =
          Math.round(
            baseScore *
              multiplier
          );

        await updateAttempt(
          attempt.id,
          {
            base_score:
              baseScore,
            correct_answers:
              correct,
            final_score:
              finalScore,
            results_published:
              true,
          }
        );
      }

      await saveWeek({
        ...week,
        status: "published",
        results_published: true,
      });

      await reloadWeeks();

      setAttempts(
        await dbAttempts(
          week.id
        )
      );

      setMessage(
        "Risultati calcolati e pubblicati!"
      );
    };

  return (
    <div className="wrap">
      <div className="title">
        <small>
          CONTROL ROOM
        </small>

        <h1>Admin</h1>
      </div>

      <div className="tabs">
        <button
          className={
            tab === "weeks"
              ? "on"
              : ""
          }
          onClick={() =>
            setTab("weeks")
          }
        >
          Settimane
        </button>

        <button
          className={
            tab === "users"
              ? "on"
              : ""
          }
          onClick={() =>
            setTab("users")
          }
        >
          Utenti
        </button>
      </div>

      {message && (
        <div className="success">
          {message}
        </div>
      )}

      {tab === "weeks" && (
        <>
          <button
            className="primaryAdminButton"
            onClick={
              createNewWeek
            }
          >
            + CREA NUOVA SETTIMANA
          </button>

          <div className="table">
            {weeks.map((week) => {
              const state =
                getWeekState(
                  week
                );

              return (
                <div
                  className="adminWeek"
                  key={week.id}
                >
                  <div>
                    <b>
                      SETTIMANA #
                      {week.number}
                    </b>

                    <small>
                      {state ===
                        "open" &&
                        "APERTA"}

                      {state ===
                        "waiting" &&
                        "IN ATTESA"}

                      {state ===
                        "closed" &&
                        "CHIUSA"}

                      {state ===
                        "published" &&
                        "RISULTATI PUBBLICATI"}

                      {state ===
                        "draft" &&
                        "BOZZA"}
                    </small>
                  </div>

                  <div className="adminActions">
                    <button
                      onClick={() =>
                        editWeek(
                          week
                        )
                      }
                    >
                      MODIFICA
                    </button>

                    <button
                      onClick={() =>
                        openResults(
                          week
                        )
                      }
                    >
                      RISULTATI
                    </button>

                    <button
                      onClick={() =>
                        toggleWeek(
                          week
                        )
                      }
                    >
                      {state ===
                      "open"
                        ? "CHIUDI"
                        : "APRI"}
                    </button>

                    <button
                      className="danger"
                      onClick={() =>
                        removeWeek(
                          week
                        )
                      }
                    >
                      ELIMINA
                    </button>
                  </div>
                </div>
              );
            })}

            {!weeks.length && (
              <div className="empty">
                Nessuna settimana
                creata.
                <br />
                Crea la Settimana #1.
              </div>
            )}
          </div>
        </>
      )}

      {tab === "users" && (
        <>
          <form
            className="adminForm"
            onSubmit={addUser}
          >
            <input
              placeholder="Nome"
              value={
                userForm.name
              }
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  name: e.target.value,
                })
              }
            />

            <input
              placeholder="Username"
              value={
                userForm.username
              }
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  username:
                    e.target.value,
                })
              }
            />

            <input
              placeholder="Password"
              type="password"
              value={
                userForm.password
              }
              onChange={(e) =>
                setUserForm({
                  ...userForm,
                  password:
                    e.target.value,
                })
              }
            />

            <button
              disabled={userBusy}
            >
              {userBusy
                ? "..."
                : "AGGIUNGI"}
            </button>
          </form>

          {userError && (
            <div className="error">
              {userError}
            </div>
          )}

          <div className="table">
            {participants.map(
              (p) => (
                <div
                  className="row"
                  key={p.username}
                >
                  <span>
                    <b>
                      {p.name}
                    </b>

                    <small>
                      @{p.username} ·{" "}
                      {p.role}
                    </small>
                  </span>

                  {p.role !==
                    "admin" && (
                    <button
                      className="danger"
                      onClick={() =>
                        removeUser(
                          p.username
                        )
                      }
                    >
                      ELIMINA
                    </button>
                  )}
                </div>
              )
            )}

            {!participants.length && (
              <div className="empty">
                Nessun giocatore
                trovato.
              </div>
            )}
          </div>
        </>
      )}

      {tab === "editWeek" &&
        editingWeek && (
          <div>
            <button
              className="backButton"
              onClick={() =>
                setTab("weeks")
              }
            >
              ← TORNA ALLE SETTIMANE
            </button>

            <div className="adminEditor">
              <h2>
                Settimana #
                {editingWeek.number}
              </h2>

              <label>
                Numero settimana

                <input
                  type="number"
                  value={
                    editingWeek.number
                  }
                  onChange={(e) =>
                    setEditingWeek({
                      ...editingWeek,
                      number: Number(
                        e.target.value
                      ),
                    })
                  }
                />
              </label>

              <label>
                Apertura

                <input
                  type="datetime-local"
                  value={toDateTimeLocalValue(
                    editingWeek.starts_at
                  )}
                  onChange={(e) =>
                    setEditingWeek({
                      ...editingWeek,
                      starts_at:
                        e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Chiusura

                <input
                  type="datetime-local"
                  value={toDateTimeLocalValue(
                    editingWeek.deadline
                  )}
                  onChange={(e) =>
                    setEditingWeek({
                      ...editingWeek,
                      deadline:
                        e.target.value,
                    })
                  }
                />
              </label>

              <QuestionEditor
                title="⚽ DOMANDE PARTITA — 10"
                questions={
                  editingWeek.matchQuestions
                }
                onChange={(
                  questions
                ) =>
                  setEditingWeek({
                    ...editingWeek,
                    matchQuestions:
                      questions,
                  })
                }
              />

              <QuestionEditor
                title="👤 DOMANDE GIOCATORE — 10"
                questions={
                  editingWeek.playerQuestions
                }
                onChange={(
                  questions
                ) =>
                  setEditingWeek({
                    ...editingWeek,
                    playerQuestions:
                      questions,
                  })
                }
              />

              <div className="correctInfo">
                💡 Puoi selezionare una
                o più risposte corrette
                per ogni domanda.
              </div>

              <button
                className="saveBig"
                onClick={
                  saveCurrentWeek
                }
                disabled={saving}
              >
                {saving
                  ? "SALVATAGGIO..."
                  : "SALVA SETTIMANA"}
              </button>
            </div>
          </div>
        )}

      {tab === "results" &&
        selectedWeek && (
          <div>
            <button
              className="backButton"
              onClick={() =>
                setTab("weeks")
              }
            >
              ← TORNA ALLE SETTIMANE
            </button>

            <div className="resultsAdmin">
              <h2>
                Risultati —
                Settimana #
                {selectedWeek.number}
              </h2>

              <div className="publishBox">
                <h3>
                  Correzione risposte
                </h3>

                <p>
                  Inserisci le risposte
                  corrette modificando
                  la settimana.
                </p>

                <button
                  onClick={() =>
                    editWeek(
                      selectedWeek
                    )
                  }
                >
                  MODIFICA RISPOSTE
                  CORRETTE
                </button>

                <button
                  className="publishButton"
                  onClick={() =>
                    calculateAndPublish(
                      selectedWeek
                    )
                  }
                >
                  CALCOLA E PUBBLICA
                  RISULTATI
                </button>
              </div>

              <div className="table">
                {attempts.map(
                  (attempt) => (
                    <div
                      className="row"
                      key={attempt.id}
                    >
                      <span>
                        <b>
                          {attempt.name ||
                            attempt.username}
                        </b>

                        <small>
                          {attempt.rigori_finished
                            ? "Partecipazione completa"
                            : "Rigori non completati"}
                        </small>
                      </span>

                      <strong>
                        {attempt.results_published
                          ? attempt.final_score
                          : "—"}
                      </strong>
                    </div>
                  )
                )}

                {!attempts.length && (
                  <div className="empty">
                    Nessun partecipante.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

/* =========================================================
   APP
   ========================================================= */

function App() {
  const [loading, setLoading] =
    useState(true);

  const [session, setSession] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [weeks, setWeeks] =
    useState([]);

  const [page, setPage] =
    useState("home");

  const [attempts, setAttempts] =
    useState([]);

  const [
    pendingQuizAnswers,
    setPendingQuizAnswers,
  ] = useState(null);

  const isAdmin =
    profile?.role === "admin";

  const reloadWeeks = async () => {
    const data = isAdmin
      ? await dbWeeksAdmin()
      : await dbWeeksPublic();

    setWeeks(data);
  };

  /* =======================================================
     SESSIONE SUPABASE
     ======================================================= */

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) =>
        setSession(data.session)
      );

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession);
        }
      );

    return () =>
      listener.subscription.unsubscribe();
  }, []);

  /* =======================================================
     PROFILO + SETTIMANE
     ======================================================= */

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setWeeks([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);

    (async () => {
      try {
        const loadedProfile =
          await dbProfile(
            session.user.id
          );

        if (cancelled) return;

        setProfile(
          loadedProfile
        );

        const data =
          loadedProfile.role ===
          "admin"
            ? await dbWeeksAdmin()
            : await dbWeeksPublic();

        if (!cancelled) {
          setWeeks(data);
        }
      } catch (err) {
        console.error(
          "Errore caricamento profilo:",
          err
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const activeWeek =
    weeks
      .filter(
        (week) =>
          getWeekState(week) ===
          "open"
      )
      .sort(
        (a, b) =>
          Number(b.number) -
          Number(a.number)
      )[0] ||
    [...weeks].sort(
      (a, b) =>
        Number(b.number) -
        Number(a.number)
    )[0];

  useEffect(() => {
    if (!activeWeek || !profile) {
      return;
    }

    dbAttempts(activeWeek.id)
      .then(setAttempts)
      .catch(console.error);
  }, [
    activeWeek?.id,
    profile?.username,
  ]);

  const myAttempt =
    attempts.find(
      (a) =>
        a.username ===
        profile?.username
    );

  /* =======================================================
     FINE QUIZ
     ======================================================= */

  const finishQuiz = async ({
    matchAnswers,
    playerAnswers,
  }) => {
    await callFunction(
      "start-attempt",
      {
        week_id: activeWeek.id,
        match_answers:
          matchAnswers,
        player_answers:
          playerAnswers,
      }
    );

    setPendingQuizAnswers({
      matchAnswers,
      playerAnswers,
    });

    setAttempts(
      await dbAttempts(
        activeWeek.id
      )
    );

    setPage("rigori");
  };

  /* =======================================================
     FINE RIGORI
     ======================================================= */

  const finishRigori =
    async () => {
      setPendingQuizAnswers(null);

      setAttempts(
        await dbAttempts(
          activeWeek.id
        )
      );

      setPage("completed");
    };

  /* =======================================================
     LOGOUT
     ======================================================= */

  const logout = async () => {
    await supabase.auth.signOut();

    setPage("home");
    setAttempts([]);
    setProfile(null);
    setWeeks([]);
  };

  /* =======================================================
     CONFIGURAZIONE MANCANTE
     ======================================================= */

  if (!supabase) {
    return (
      <div className="empty">
        <h2>
          Configurazione mancante
        </h2>

        <p>
          Imposta VITE_SUPABASE_URL e
          VITE_SUPABASE_ANON_KEY per
          usare Fantaluck.
        </p>
      </div>
    );
  }

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className="loading">
        🍀
      </div>
    );
  }

  /* =======================================================
     LOGIN
     ======================================================= */

  if (
    !session?.user ||
    !profile
  ) {
    return (
      <Login
        onLoggedIn={() => {}}
      />
    );
  }

  /* =======================================================
     APP AUTENTICATA
     ======================================================= */

  return (
    <>
      <header>
        <div className="brand">
          🍀 FANTALUCK
        </div>

        <span>
          {profile.name}
        </span>
      </header>

      {page === "home" && (
        <Home
          week={activeWeek}
          profile={profile}
          setPage={setPage}
          attempt={myAttempt}
        />
      )}

      {page === "quiz" && (
        myAttempt ? (
          <div className="empty">
            Hai già partecipato a
            questa settimana.
          </div>
        ) : (
          <Quiz
            week={activeWeek}
            onDone={finishQuiz}
          />
        )
      )}

      {page === "rigori" && (
        <Rigori
          week={activeWeek}
          onDone={finishRigori}
        />
      )}

      {page === "completed" && (
        <Completed
          setPage={setPage}
        />
      )}

      {page === "rank" && (
        <Rank
          week={activeWeek}
          attempts={attempts}
          profile={profile}
        />
      )}

      {page === "admin" &&
        isAdmin && (
          <Admin
            weeks={weeks}
            setWeeks={setWeeks}
            reloadWeeks={
              reloadWeeks
            }
          />
        )}

      <Nav
        page={page}
        setPage={setPage}
        profile={profile}
        onLogout={logout}
      />
    </>
  );
}

createRoot(
  document.getElementById("root")
).render(<App />);
