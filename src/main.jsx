import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabase";
import "./styles.css";

/* =========================================================
   FANTALUCK — La sfida settimanale
   ========================================================= */

const EMAIL_DOMAIN = "fantaluck.local";

const toAuthEmail = (username) => {
  const value = username.trim().toLowerCase();
  return value.includes("@") ? value : `${value}@${EMAIL_DOMAIN}`;
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
   ICONS — FANTALUCK SVG
   ========================================================= */

function Icon({ name, size = 22, strokeWidth = 2 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    className: "flIcon",
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5.5 9.5V21h13V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      );

    case "ball":
      return (
        <svg {...common}>
          <path d="M12 3.2 18.7 8l-2.6 8H7.9L5.3 8 12 3.2Z" />
          <path d="m12 3.2 2.1 5.3M18.7 8l-4.6.5M16.1 16l2.9 2.2M7.9 16 5 18.2M5.3 8l4.6.5M9.9 16 8.7 21" />
        </svg>
      );

    case "trophy":
      return (
        <svg {...common}>
          <path d="M8 4h8v5.5a4 4 0 0 1-8 0V4Z" />
          <path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4" />
          <path d="M12 13.5V18" />
          <path d="M8 21h8" />
          <path d="M9 18h6" />
        </svg>
      );

    case "settings":
      return (
        <svg {...common}>
          <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
          <path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M10 4H5v16h5" />
          <path d="M14 8l4 4-4 4" />
          <path d="M18 12H8" />
        </svg>
      );

    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      );

    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
          <path d="M16 5.5a3 3 0 0 1 0 5.8" />
          <path d="M17 14a5 5 0 0 1 4 6" />
        </svg>
      );

    case "eye":
      return (
        <svg {...common}>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );

    case "close":
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "x":
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );

    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
        </svg>
      );

    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v6" />
          <path d="M12 7h.01" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h13" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "arrow-left":
      return (
        <svg {...common}>
          <path d="M19 12H5" />
          <path d="m11 6-6 6 6 6" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );

    default:
      return null;
  }
}

/* =========================================================
   HELPERS
   ========================================================= */

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

  if (Number.isNaN(date.getTime())) return "";

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
      // usa il messaggio predefinito
    }

    throw new Error(message);
  }

  return data;
}

/* =========================================================
   AGGIORNA PRONOSTICI INDOVINATI
   ========================================================= */

async function updatePronostici(userId, delta) {
  return callFunction("pronostici", {
    user_id: userId,
    delta,
  });
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

async function dbPublicProfiles() {
  const { data, error } = await supabase
    .from("profiles_public")
    .select("id, username, name, pronostici_indovinati")
    .order("pronostici_indovinati", {
      ascending: false,
    })
    .order("name", {
      ascending: true,
    });

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
      ? Math.max(
          0,
          new Date(target).getTime() - Date.now()
        )
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

  if (
    !target ||
    (state !== "waiting" && state !== "open")
  ) {
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
          <strong>
            {String(days).padStart(2, "0")}
          </strong>
          <small>GIORNI</small>
        </div>

        <b>:</b>

        <div>
          <strong>
            {String(hours).padStart(2, "0")}
          </strong>
          <small>ORE</small>
        </div>

        <b>:</b>

        <div>
          <strong>
            {String(minutes).padStart(2, "0")}
          </strong>
          <small>MIN</small>
        </div>

        <b>:</b>

        <div>
          <strong>
            {String(seconds).padStart(2, "0")}
          </strong>
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

    if (authError || !data?.user) {
      setLoading(false);
      setError("Username o password non validi.");
      return;
    }

    try {
      const profile = await dbProfile(data.user.id);

      if (profile.blocked === true) {
        await supabase.auth.signOut();

        setLoading(false);

        setError(
          "ACCOUNT BLOCCATO. Contatta l'organizzatore."
        );

        return;
      }

      setLoading(false);
      onLoggedIn();
    } catch (err) {
      console.error(err);

      await supabase.auth.signOut();

      setLoading(false);

      setError(
        "Impossibile verificare lo stato dell'account."
      );
    }
  };

  return (
    <main className="login">
      <div className="loginCard">
        <div className="logo">
          <span className="logoIcon">
            <Icon name="target" size={25} />
          </span>
          FANTALUCK
        </div>

        <p className="tag">
          LA SFIDA SETTIMANALE
        </p>

        <form onSubmit={submit}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
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
        className={
          page === "home" ? "active" : ""
        }
        onClick={() => setPage("home")}
      >
        <Icon name="home" size={21} />
        <span>Home</span>
      </button>

      <button
        className={
          page === "quiz" ? "active" : ""
        }
        onClick={() => setPage("quiz")}
      >
        <Icon name="ball" size={21} />
        <span>Gioca</span>
      </button>

      <button
        className={
          page === "rank" ? "active" : ""
        }
        onClick={() => setPage("rank")}
      >
        <Icon name="trophy" size={21} />
        <span>Classifica</span>
      </button>

      {profile.role === "admin" && (
        <button
          className={
            page === "admin" ? "active" : ""
          }
          onClick={() => setPage("admin")}
        >
          <Icon name="settings" size={21} />
          <span>Admin</span>
        </button>
      )}

      <button onClick={onLogout}>
        <Icon name="logout" size={21} />
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
          <Icon name="target" size={16} />
          FANTALUCK
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
            GIOCA ORA <Icon name="arrow" size={18} />
          </button>
        )}

        {state === "waiting" && (
          <div className="notice">
            La nuova sfida non è ancora iniziata.
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
            VEDI RISULTATI <Icon name="arrow" size={18} />
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
            {state === "waiting" && "IN ARRIVO"}
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

          <strong>{profile.name}</strong>

          <span>
            @{profile.username}
          </span>
        </div>

        <div className="card pronosticiCard">
          <div className="pronosticiCardTop">
            <small>PRONOSTICI INDOVINATI</small>

            <button
              type="button"
              className="pronosticiDashboardButton"
              onClick={() =>
                setPage("pronostici")
              }
              aria-label="Apri classifica pronostici"
              title="Classifica pronostici"
            >
              <Icon
                name="target"
                size={20}
              />
            </button>
          </div>

          <strong>
            {Number(
              profile.pronostici_indovinati || 0
            )}
          </strong>

          <span>pronostici corretti</span>
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
          <Icon name="chevron" size={18} />
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

function Quiz({
  week,
  onDone,
}) {
  const questions = useMemo(
    () => [
      ...(week?.matchQuestions || []),
      ...(week?.playerQuestions || []),
    ],
    [week]
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
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
          {(question?.options || [
            "A",
            "B",
            "C",
            "D",
          ]).map((option, i) => (
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
              index === 0 ||
              submitting
            }
          >
            <Icon name="arrow-left" size={16} />
            INDIETRO
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
              : "AVANTI"}
            {!submitting && (
              <Icon name="arrow" size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   RIGORI
   ========================================================= */

function Rigori({
  week,
  onDone,
}) {
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

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const status = await callFunction(
          "rigori",
          {
            week_id: week.id,
            action: "status",
          }
        );

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
  }, [week.id]);

  const shoot = async (cell) => {
    if (busy || result) return;

    setBusy(true);
    setError("");
    setSelected(cell);

    try {
      const response =
        await callFunction(
          "rigori",
          {
            week_id: week.id,
            cell,
          }
        );

      setResult({
        goal: response.goal,
        multiplier:
          response.multiplier,
      });

      setGoals(
        response.goals
      );

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
          <Icon name="target" size={35} />
          <span>PORTA</span>
        </div>

        <h1>RIGORI</h1>

        <p>
          Scegli una casella.
          <br />
          Non sai dove si trova
          la parata.
        </p>

        <div className="difficulty">
          <b>
            {goalCount}/12
          </b>

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
                  Boolean(result) ||
                  busy
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
              <Icon
                name={
                  result.goal
                    ? "ball"
                    : "target"
                }
                size={42}
              />
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
              onClick={
                continueShot
              }
            >
              {result.goal
                ? "PROSSIMO RIGORE"
                : "CONTINUA"}
              <Icon name="arrow" size={16} />
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

function Completed({
  setPage,
}) {
  return (
    <div className="wrap">
      <div className="completedCard">
        <div className="completedIcon">
          <Icon name="check" size={38} />
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
  profile,
}) {
  const matchQuestions =
    week?.matchQuestions || [];

  const playerQuestions =
    week?.playerQuestions || [];

  const matchAnswers =
    attempt?.match_answers || [];

  const playerAnswers =
    attempt?.player_answers || [];

  const isMine =
    attempt?.username ===
    profile?.username;

  const reviewedName =
    attempt?.name ||
    attempt?.username ||
    "Giocatore";

  const renderQuestion = (
    question,
    answer,
    index
  ) => {
    const correctAnswers =
      getCorrectAnswers(question);

    const isCorrect =
      Boolean(
        answer &&
          correctAnswers.includes(
            answer
          )
      );

    return (
      <div
        className={
          isCorrect
            ? "reviewQuestion reviewCorrect"
            : "reviewQuestion reviewWrong"
        }
        key={
          question?.id ||
          index
        }
      >
        <div className="reviewQuestionTop">
          <span>
            DOMANDA {index + 1}
          </span>

          <strong>
            {isCorrect ? (
              <>
                <Icon
                  name="check"
                  size={13}
                />
                CORRETTA
              </>
            ) : (
              <>
                <Icon
                  name="x"
                  size={13}
                />
                ERRATA
              </>
            )}
          </strong>
        </div>

        <h3>
          {question?.text ||
            "Domanda"}
        </h3>

        <div className="reviewAnswer">
          <small>
            {isMine
              ? "LA TUA RISPOSTA"
              : `RISPOSTA DI ${reviewedName.toUpperCase()}`}
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
          e.target ===
          e.currentTarget
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
              {isMine
                ? "La tua partecipazione"
                : `Partecipazione di ${reviewedName}`}
            </h2>
          </div>

          <button
            className="reviewClose"
            onClick={onClose}
            aria-label="Chiudi"
          >
            <Icon
              name="close"
              size={19}
            />
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
                attempt?.multiplier ||
                  1
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
            <Icon
              name="ball"
              size={20}
            />
            DOMANDE PARTITA
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
            <Icon
              name="user"
              size={20}
            />
            DOMANDE GIOCATORE
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
   RANKING CLASSIFICA GENERALE
   ========================================================= */

function Rank({
  week,
  attempts,
  profile,
}) {
  const [reviewAttempt, setReviewAttempt] =
    useState(null);

  const [rankAttempts, setRankAttempts] =
    useState(attempts || []);

  const [rankError, setRankError] =
    useState("");

  useEffect(() => {
    if (!week?.id) {
      setRankAttempts([]);
      return;
    }

    let cancelled = false;

    setRankError("");

    dbAttempts(week.id)
      .then((data) => {
        if (!cancelled) {
          setRankAttempts(data || []);
        }
      })
      .catch((err) => {
        console.error(err);

        if (!cancelled) {
          setRankError(
            "Impossibile aggiornare la classifica."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [week?.id]);

  if (!week?.results_published) {
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

          <h2>
            Risultati non ancora pubblicati
          </h2>

          <p>
            L'organizzatore deve prima correggere le
            risposte e pubblicare i risultati.
          </p>
        </div>
      </div>
    );
  }

  const rows = [...rankAttempts]
    .filter(
      (attempt) =>
        attempt.results_published === true ||
        week.results_published === true
    )
    .sort(
      (a, b) =>
        Number(b.final_score || 0) -
        Number(a.final_score || 0)
    );

  return (
    <div className="wrap">
      <div className="title">
        <small>SETTIMANA #{week.number}</small>
        <h1>Classifica</h1>

        <p className="rankingHint">
          Clicca su un giocatore per vedere le sue risposte.
        </p>
      </div>

      {rankError && (
        <div className="error">
          {rankError}
        </div>
      )}

      <div className="table">
        {rows.map((attempt, index) => {
          const isMine =
            attempt.username === profile.username;

          return (
            <div
              className={
                isMine
                  ? "row currentPlayer clickableRow"
                  : "row clickableRow"
              }
              key={attempt.id || attempt.username}
              onClick={() =>
                setReviewAttempt(attempt)
              }
            >
              <b>{index + 1}</b>

              <span>
                <strong>
                  {attempt.name || attempt.username}
                </strong>

                <small>
                  {attempt.correct_answers || 0}/20 corrette · {attempt.goals || 0} gol
                </small>

                <span className="answerReviewHint">
                  {isMine
                    ? "CLICCA PER RIVEDERE LE RISPOSTE"
                    : "CLICCA PER VEDERE LE RISPOSTE"}
                </span>
              </span>

              <strong>
                {attempt.final_score || 0}
              </strong>
            </div>
          );
        })}

        {!rows.length && (
          <div className="empty">
            Nessun risultato disponibile.
          </div>
        )}
      </div>

      {reviewAttempt && (
        <AnswerReview
          week={week}
          attempt={reviewAttempt}
          profile={profile}
          onClose={() =>
            setReviewAttempt(null)
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   PRONOSTICI RANKING
   ========================================================= */

function PronosticiRank({
  profile,
  setPage,
}) {
  const [profiles, setProfiles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await dbPublicProfiles();

        if (!cancelled) {
          setProfiles(data);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "Impossibile caricare la classifica dei pronostici."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = [...profiles].sort(
    (a, b) => {
      const diff =
        Number(
          b.pronostici_indovinati || 0
        ) -
        Number(
          a.pronostici_indovinati || 0
        );

      if (diff !== 0) return diff;

      return String(
        a.name ||
          a.username ||
          ""
      ).localeCompare(
        String(
          b.name ||
            b.username ||
            ""
        )
      );
    }
  );

  return (
    <div className="wrap">
      <div className="title">
        <small>FANTALUCK</small>

        <h1>
          Pronostici
        </h1>

        <p className="rankingHint">
          Classifica dei pronostici indovinati.
        </p>
      </div>

      <div className="pronosticiRankingHeader">
        <div className="pronosticiRankingIcon">
          <Icon
            name="target"
            size={27}
          />
        </div>

        <div className="pronosticiRankingText">
          <strong>
            PRONOSTICI INDOVINATI
          </strong>

          <span>
            Tutti i giocatori
          </span>
        </div>
      </div>

      {loading && (
        <div className="empty">
          Caricamento classifica...
        </div>
      )}

      {error && !loading && (
        <div className="error">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        rows.length > 0 && (
          <div className="table pronosticiRankingTable">
            {rows.map(
              (player, index) => {
                const isMine =
                  player.username ===
                  profile?.username;

                return (
                  <div
                    className={
                      isMine
                        ? "row currentPlayer pronosticiRankingRow"
                        : "row pronosticiRankingRow"
                    }
                    key={
                      player.id ||
                      player.username
                    }
                  >
                    <b>
                      {index + 1}
                    </b>

                    <span>
                      <strong>
                        {player.name ||
                          player.username}
                      </strong>

                      <small>
                        @{player.username}
                      </small>
                    </span>

                    <strong className="pronosticiRankingValue">
                      {Number(
                        player.pronostici_indovinati ||
                          0
                      )}
                    </strong>
                  </div>
                );
              }
            )}
          </div>
        )}

      {!loading &&
        !error &&
        !rows.length && (
          <div className="empty">
            Nessun giocatore trovato.
          </div>
        )}

      <button
        className="backButton"
        onClick={() =>
          setPage("home")
        }
      >
        <Icon name="arrow-left" size={16} />
        TORNA ALLA HOME
      </button>
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
      ...(currentQuestion.options ||
        []),
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
        ? correct.map(
            (item) =>
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
      getCorrectAnswers(
        question
      );

    const exists =
      current.includes(option);

    const correct = exists
      ? current.filter(
          (item) =>
            item !== option
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
                        65 +
                          optionIndex
                      )}`}
                      value={
                        question.options?.[
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
                              checked={
                                checked
                              }
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

  const [
    selectedWeekId,
    setSelectedWeekId,
  ] = useState(null);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [
    editingWeek,
    setEditingWeek,
  ] = useState(null);

  const [attempts, setAttempts] =
    useState([]);

  const [
    participants,
    setParticipants,
  ] = useState([]);

  const [userForm, setUserForm] =
    useState({
      username: "",
      name: "",
      password: "",
    });

  const [userBusy, setUserBusy] =
    useState(false);

  const [
    userError,
    setUserError,
  ] = useState("");

  const [
    pronosticiBusyId,
    setPronosticiBusyId,
  ] = useState(null);

  const reloadParticipants =
    () =>
      dbAllProfiles()
        .then(setParticipants)
        .catch(console.error);

  useEffect(() => {
    if (tab === "users") {
      reloadParticipants();
    }
  }, [tab]);

  const changePronostici = async (
    userId,
    delta
  ) => {
    if (pronosticiBusyId) return;

    setPronosticiBusyId(userId);

    try {
      const data =
        await updatePronostici(
          userId,
          delta
        );

      if (data?.profile) {
        setParticipants(
          (current) =>
            current.map((p) =>
              p.id ===
              data.profile.id
                ? {
                    ...p,
                    pronostici_indovinati:
                      data.profile
                        .pronostici_indovinati,
                  }
                : p
            )
        );
      }
    } catch (err) {
      alert(
        err.message ||
          "Impossibile aggiornare i pronostici indovinati."
      );
    } finally {
      setPronosticiBusyId(null);
    }
  };

  /* =======================================================
     BLOCCA / SBLOCCA UTENTE
     ======================================================= */

  const toggleUserBlock = async (
    username,
    currentlyBlocked
  ) => {
    const action = currentlyBlocked
      ? "sbloccare"
      : "bloccare";

    const confirmed = window.confirm(
      `Vuoi ${action} ${username}?`
    );

    if (!confirmed) return;

    try {
      const data = await callFunction(
        "bloccautente",
        {
          username,
          blocked: !currentlyBlocked,
        }
      );

      if (data?.profile) {
        setParticipants(
          (current) =>
            current.map((p) =>
              p.id === data.profile.id
                ? {
                    ...p,
                    blocked:
                      data.profile.blocked,
                  }
                : p
            )
        );
      }
    } catch (err) {
      alert(
        err.message ||
          "Impossibile modificare lo stato dell'account."
      );
    }
  };

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

  /* =======================================================
     ELIMINAZIONE PERMANENTE — INVARIATA
     ======================================================= */

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
        {
          username,
        }
      );

      await reloadParticipants();
    } catch (err) {
      alert(
        err.message ||
          "Impossibile eliminare il giocatore."
      );
    }
  };

  const selectedWeek =
    weeks.find(
      (w) =>
        w.id === selectedWeekId
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

  const saveCurrentWeek =
    async () => {
      if (!editingWeek) return;

      setSaving(true);
      setMessage("");

      try {
        const normalizedWeek =
          normalizeWeek(
            editingWeek
          );

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

    setSelectedWeekId(
      week.id
    );

    setTab("editWeek");
  };

  const removeWeek =
    async (week) => {
      if (
        !window.confirm(
          `Eliminare la Settimana #${week.number}?`
        )
      ) {
        return;
      }

      await deleteWeek(
        week.id
      );

      await reloadWeeks();

      if (
        selectedWeekId ===
        week.id
      ) {
        setSelectedWeekId(null);
        setEditingWeek(null);
      }
    };

  const toggleWeek =
    async (week) => {
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

  const openResults =
    async (week) => {
      setSelectedWeekId(
        week.id
      );

      const data =
        await dbAttempts(
          week.id
        );

      setAttempts(data);
      setTab("results");
    };

  const allAnswersInserted =
    (week) => {
      const questions = [
        ...(week.matchQuestions ||
          []),
        ...(week.playerQuestions ||
          []),
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
        !allAnswersInserted(
          week
        )
      ) {
        alert(
          "Inserisci almeno una risposta corretta per tutte le 20 domande prima di pubblicare."
        );

        return;
      }

      const currentAttempts =
        await dbAttempts(
          week.id
        );

      if (
        !currentAttempts.length
      ) {
        alert(
          "Nessun giocatore ha ancora partecipato."
        );

        return;
      }

      const notFinished =
        currentAttempts.filter(
          (a) =>
            !a.rigori_finished
        );

      if (notFinished.length) {
        const proceed =
          window.confirm(
            `${notFinished.length} giocatore/i non ha ancora terminato i rigori. Vuoi pubblicare comunque escludendo loro dal calcolo del punteggio?`
          );

        if (!proceed) return;
      }

      const allQuestions = [
        ...(week.matchQuestions ||
          []),
        ...(week.playerQuestions ||
          []),
      ];

      for (const attempt of currentAttempts) {
        if (
          !attempt.rigori_finished
        ) {
          continue;
        }

        const answers = [
          ...(attempt.match_answers ||
            []),
          ...(attempt.player_answers ||
            []),
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
            attempt.multiplier ||
              1
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
            {weeks.map(
              (week) => {
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
              }
            )}

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
                  name:
                    e.target.value,
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
                  className="row adminUserRow"
                  key={p.username}
                >
                  <span>
                    <b>{p.name}</b>

                    <small>
                      @{p.username} · {p.role}
                    </small>

                    <small
                      className={
                        p.blocked
                          ? "adminUserStatus blocked"
                          : "adminUserStatus active"
                      }
                    >
                      {p.blocked
                        ? "● ACCOUNT BLOCCATO"
                        : "● ACCOUNT ATTIVO"}
                    </small>

                    <small className="adminPronosticiLabel">
                      PRONOSTICI INDOVINATI
                    </small>

                    <strong className="adminPronosticiValue">
                      {Number(
                        p.pronostici_indovinati || 0
                      )}
                    </strong>
                  </span>

                  {p.role !== "admin" && (
                    <div className="adminUserActions">
                      <div className="pronosticiControls">
                        <button
                          type="button"
                          className="pronosticiButton"
                          onClick={() =>
                            changePronostici(p.id, 1)
                          }
                          disabled={
                            pronosticiBusyId === p.id
                          }
                          title="Aumenta"
                        >
                          ▲
                        </button>

                        <button
                          type="button"
                          className="pronosticiButton"
                          onClick={() =>
                            changePronostici(p.id, -1)
                          }
                          disabled={
                            pronosticiBusyId === p.id ||
                            Number(
                              p.pronostici_indovinati || 0
                            ) <= 0
                          }
                          title="Diminuisci"
                        >
                          ▼
                        </button>
                      </div>

                      <button
                        type="button"
                        className={
                          p.blocked
                            ? "userBlockButton unblock"
                            : "userBlockButton"
                        }
                        onClick={() =>
                          toggleUserBlock(
                            p.username,
                            Boolean(p.blocked)
                          )
                        }
                      >
                        {p.blocked
                          ? "SBLOCCA"
                          : "BLOCCA"}
                      </button>

                      <button
                        className="danger"
                        onClick={() =>
                          removeUser(p.username)
                        }
                      >
                        ELIMINA
                      </button>
                    </div>
                  )}
                </div>
              )
            )}

            {!participants.length && (
              <div className="empty">
                Nessun giocatore trovato.
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
              <Icon name="arrow-left" size={16} />
              TORNA ALLE SETTIMANE
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
                      number:
                        Number(
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
                title="DOMANDE PARTITA — 10"
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
                title="DOMANDE GIOCATORE — 10"
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
                <Icon
                  name="info"
                  size={18}
                />
                Puoi selezionare
                una o più risposte
                corrette per ogni
                domanda.
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
              <Icon name="arrow-left" size={16} />
              TORNA ALLE SETTIMANE
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

  const isAdmin =
    profile?.role === "admin";

  const reloadWeeks = async () => {
    const data = isAdmin
      ? await dbWeeksAdmin()
      : await dbWeeksPublic();

    setWeeks(data);
  };

  /* -------------------------------------------------------
     SESSIONE SUPABASE
  ------------------------------------------------------- */

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) =>
        setSession(
          data.session
        )
      );

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(
            newSession
          );
        }
      );

    return () =>
      listener.subscription.unsubscribe();
  }, []);

  /* -------------------------------------------------------
     PROFILO + SETTIMANE
  ------------------------------------------------------- */

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

        /* =================================================
           CONTROLLO ACCOUNT BLOCCATO
           ================================================= */

        if (loadedProfile.blocked === true) {
          await supabase.auth.signOut();

          if (!cancelled) {
            setProfile(null);
            setWeeks([]);
            setSession(null);
          }

          return;
        }

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
        console.error(err);
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

  /* -------------------------------------------------------
     SETTIMANA ATTIVA
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     TENTATIVI
  ------------------------------------------------------- */

  useEffect(() => {
    if (
      !activeWeek ||
      !profile
    ) {
      return;
    }

    dbAttempts(
      activeWeek.id
    )
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

  /* -------------------------------------------------------
     FINE QUIZ
  ------------------------------------------------------- */

  const finishQuiz =
    async ({
      matchAnswers,
      playerAnswers,
    }) => {
      await callFunction(
        "start-attempt",
        {
          week_id:
            activeWeek.id,

          match_answers:
            matchAnswers,

          player_answers:
            playerAnswers,
        }
      );

      setAttempts(
        await dbAttempts(
          activeWeek.id
        )
      );

      setPage("rigori");
    };

  /* -------------------------------------------------------
     FINE RIGORI
  ------------------------------------------------------- */

  const finishRigori =
    async () => {
      setAttempts(
        await dbAttempts(
          activeWeek.id
        )
      );

      setPage("completed");
    };

  /* -------------------------------------------------------
     LOGOUT
  ------------------------------------------------------- */

  const logout =
    async () => {
      await supabase.auth.signOut();

      setPage("home");
      setAttempts([]);
      setProfile(null);
      setSession(null);
    };

  /* -------------------------------------------------------
     CONFIGURAZIONE
  ------------------------------------------------------- */

  if (!supabase) {
    return (
      <div className="empty">
        <h2>
          Configurazione mancante
        </h2>

        <p>
          Imposta
          VITE_SUPABASE_URL e
          VITE_SUPABASE_ANON_KEY
          per usare Fantaluck.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <Icon
          name="target"
          size={38}
        />
      </div>
    );
  }

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

  return (
    <>
      <header>
        <div className="brand">
          <Icon
            name="target"
            size={22}
          />
          FANTALUCK
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

      {page === "quiz" &&
        (myAttempt ? (
          <div className="empty">
            Hai già partecipato a
            questa settimana.
          </div>
        ) : (
          <Quiz
            week={activeWeek}
            onDone={
              finishQuiz
            }
          />
        ))}

      {page === "rigori" && (
        <Rigori
          week={activeWeek}
          onDone={
            finishRigori
          }
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

      {page === "pronostici" && (
        <PronosticiRank
          profile={profile}
          setPage={setPage}
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
