import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabase";
import "./styles.css";

/* =========================================================
   FANTALUCK
   La sfida settimanale
   ========================================================= */

const EMPTY_OPTIONS = ["", "", "", ""];

/*
   Le risposte corrette ora sono un ARRAY.
   Esempio:
   correct: ["Inter", "Milan"]

   Manteniamo comunque la compatibilità con
   le vecchie domande che avevano:
   correct: "Inter"
*/

const makeQuestion = (type, index) => ({
  id: `${type}-${index + 1}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`,
  text: "",
  options: [...EMPTY_OPTIONS],
  correct: [],
});

const makeQuestions = (type) =>
  Array.from({ length: 10 }, (_, i) =>
    makeQuestion(type, i)
  );

/* =========================================================
   NORMALIZZAZIONE RISPOSTE CORRETTE
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
    id:
      question?.id ||
      `${type}-${index + 1}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,
    text: question?.text || "",
    options:
      Array.isArray(question?.options)
        ? [
            ...question.options,
            ...EMPTY_OPTIONS,
          ].slice(0, 4)
        : [...EMPTY_OPTIONS],
    correct: getCorrectAnswers(question),
  };
}

function normalizeQuestions(questions, type) {
  if (!Array.isArray(questions) || questions.length !== 10) {
    return makeQuestions(type);
  }

  return questions.map((question, index) =>
    normalizeQuestion(question, type, index)
  );
}

/* =========================================================
   NUOVA SETTIMANA
   ========================================================= */

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
   LOCAL STORAGE
   ========================================================= */

function localGet(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function localSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return (
    crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`
  );
}

/* =========================================================
   DATE / DATETIME LOCAL
   ========================================================= */

/*
   Converte una data salvata in formato ISO
   nel formato richiesto da <input type="datetime-local">.

   Evita che l'orario visualizzato dall'Admin
   venga spostato a causa del fuso orario.
*/

function toDateTimeLocalValue(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 16);
  }

  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
}

/* =========================================================
   DATABASE
   ========================================================= */

async function dbUsers() {
  if (!supabase) {
    return localGet("fl_users", [
      {
        username: "admin",
        password: "admin123",
        role: "admin",
        name: "Organizzatore",
      },
      {
        username: "giocatore1",
        password: "start1",
        role: "participant",
        name: "Giocatore 1",
      },
    ]);
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("username");

  if (error) throw error;

  return data || [];
}

async function saveUsers(users) {
  if (!supabase) {
    localSet("fl_users", users);
    return;
  }

  const { error } = await supabase
    .from("users")
    .upsert(users, {
      onConflict: "username",
    });

  if (error) throw error;
}

async function dbWeeks() {
  if (!supabase) {
    return localGet("fl_weeks", []);
  }

  const { data, error } = await supabase
    .from("weeks")
    .select("*")
    .order("number", {
      ascending: true,
    });

  if (error) throw error;

  return data || [];
}

async function saveWeek(week) {
  /*
     Prima di salvare, normalizziamo sempre
     le domande in modo che correct sia un array.
  */

  const normalizedWeek = {
    ...week,

    matchQuestions: normalizeQuestions(
      week.matchQuestions,
      "match"
    ),

    playerQuestions: normalizeQuestions(
      week.playerQuestions,
      "player"
    ),
  };

  if (!supabase) {
    const weeks = localGet("fl_weeks", []);

    const next = weeks.filter(
      (w) => w.id !== normalizedWeek.id
    );

    localSet("fl_weeks", [
      ...next,
      normalizedWeek,
    ]);

    return;
  }

  const { error } = await supabase
    .from("weeks")
    .upsert(normalizedWeek, {
      onConflict: "id",
    });

  if (error) throw error;
}

async function deleteWeek(id) {
  if (!supabase) {
    const weeks = localGet("fl_weeks", []);

    localSet(
      "fl_weeks",
      weeks.filter((w) => w.id !== id)
    );

    return;
  }

  const { error } = await supabase
    .from("weeks")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

async function dbAttempts(weekId) {
  if (!supabase) {
    return localGet(
      `fl_attempts_${weekId}`,
      []
    );
  }

  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("week_id", weekId);

  if (error) throw error;

  return data || [];
}

async function saveAttempt(attempt) {
  if (!supabase) {
    const attempts = localGet(
      `fl_attempts_${attempt.week_id}`,
      []
    );

    const next = attempts.filter(
      (a) => a.username !== attempt.username
    );

    localSet(
      `fl_attempts_${attempt.week_id}`,
      [...next, attempt]
    );

    return;
  }

  const { error } = await supabase
    .from("attempts")
    .upsert(attempt, {
      onConflict: "week_id,username",
    });

  if (error) throw error;
}

async function updateAttempt(id, values) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("attempts")
    .update(values)
    .eq("id", id);

  if (error) throw error;
}

/* =========================================================
   DATE / WEEK STATUS
   ========================================================= */

function getWeekState(week) {
  if (!week) return "none";

  const now = Date.now();

  const start = week.starts_at
    ? new Date(week.starts_at).getTime()
    : null;

  const end = week.deadline
    ? new Date(week.deadline).getTime()
    : null;

  if (week.status === "closed") {
    return "closed";
  }

  if (week.status === "published") {
    return "published";
  }

  if (start && now < start) {
    return "waiting";
  }

  if (end && now > end) {
    return "closed";
  }

  if (week.status === "open") {
    return "open";
  }

  return "draft";
}

/* =========================================================
   COUNTDOWN
   ========================================================= */

function formatCountdown(milliseconds) {
  if (milliseconds <= 0) {
    return "00g 00h 00m 00s";
  }

  const totalSeconds = Math.floor(
    milliseconds / 1000
  );

  const days = Math.floor(
    totalSeconds / 86400
  );

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  return `${String(days).padStart(
    2,
    "0"
  )}g ${String(hours).padStart(
    2,
    "0"
  )}h ${String(minutes).padStart(
    2,
    "0"
  )}m ${String(seconds).padStart(
    2,
    "0"
  )}s`;
}

function Countdown({ week }) {
  const state = getWeekState(week);

  const target =
    state === "waiting"
      ? week?.starts_at
      : state === "open"
      ? week?.deadline
      : null;

  const [remaining, setRemaining] =
    useState(() => {
      if (!target) return 0;

      return Math.max(
        0,
        new Date(target).getTime() -
          Date.now()
      );
    });

  useEffect(() => {
    if (!target) {
      setRemaining(0);
      return;
    }

    const update = () => {
      setRemaining(
        Math.max(
          0,
          new Date(target).getTime() -
            Date.now()
        )
      );
    };

    update();

    const interval = setInterval(
      update,
      1000
    );

    return () =>
      clearInterval(interval);
  }, [target]);

  if (
    !target ||
    (state !== "waiting" &&
      state !== "open")
  ) {
    return null;
  }

  return (
    <div className="countdownCard">
      <small>
        {state === "waiting"
          ? "⏳ INIZIO TRA"
          : "⏰ CHIUSURA TRA"}
      </small>

      <strong>
        {formatCountdown(remaining)}
      </strong>

      <span>
        {state === "waiting"
          ? "Preparati alla sfida"
          : "Affrettati a completare la sfida"}
      </span>
    </div>
  );
}

/* =========================================================
   SCORE
   ========================================================= */

function calculateQuizScore(
  week,
  matchAnswers,
  playerAnswers
) {
  const allQuestions = [
    ...(week.matchQuestions || []),
    ...(week.playerQuestions || []),
  ];

  const answers = [
    ...(matchAnswers || []),
    ...(playerAnswers || []),
  ];

  let correct = 0;

  allQuestions.forEach(
    (question, index) => {
      const correctAnswers =
        getCorrectAnswers(question);

      const userAnswer =
        answers[index];

      if (
        correctAnswers.length > 0 &&
        userAnswer &&
        correctAnswers.includes(userAnswer)
      ) {
        correct++;
      }
    }
  );

  return {
    correct,
    baseScore: correct * 10,
  };
}

/* =========================================================
   RANDOM RIGORI
   ========================================================= */

function createRandomSaves(goalCount) {
  const cells = Array.from(
    { length: 12 },
    (_, i) => i
  );

  for (
    let i = cells.length - 1;
    i > 0;
    i--
  ) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [cells[i], cells[j]] = [
      cells[j],
      cells[i],
    ];
  }

  const saveCount =
    12 - goalCount;

  return new Set(
    cells.slice(0, saveCount)
  );
}

function goalsAvailableForShot(
  shotNumber
) {
  const pair = Math.floor(
    shotNumber / 2
  );

  return Math.max(
    2,
    11 - pair
  );
}

/* =========================================================
   LOGIN
   ========================================================= */

function Login({
  users,
  onLogin,
}) {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const submit = (event) => {
    event.preventDefault();

    const user = users.find(
      (u) =>
        u.username ===
          username.trim() &&
        u.password === password
    );

    if (!user) {
      setError(
        "Username o password non validi."
      );

      return;
    }

    onLogin(user);
  };

  return (
    <main className="login">
      <div className="loginCard">
        <div className="logo">
          🍀 FANTALUCK
        </div>

        <p className="tag">
          LA SFIDA SETTIMANALE
        </p>

        <form onSubmit={submit}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
          />

          <button type="submit">
            ENTRA
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
  user,
  onLogout,
}) {
  return (
    <nav>
      <button
        className={
          page === "home"
            ? "active"
            : ""
        }
        onClick={() =>
          setPage("home")
        }
      >
        🏠
        <span>Home</span>
      </button>

      <button
        className={
          page === "quiz"
            ? "active"
            : ""
        }
        onClick={() =>
          setPage("quiz")
        }
      >
        ⚽
        <span>Gioca</span>
      </button>

      <button
        className={
          page === "rank"
            ? "active"
            : ""
        }
        onClick={() =>
          setPage("rank")
        }
      >
        🏆
        <span>Classifica</span>
      </button>

      {user.role === "admin" && (
        <button
          className={
            page === "admin"
              ? "active"
              : ""
          }
          onClick={() =>
            setPage("admin")
          }
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
   REGOLAMENTO
   ========================================================= */

function RulesCard({ week }) {
  return (
    <div className="rulesCard">
      <div className="rulesHeader">
        <div>
          <small>FANTALUCK</small>
          <h2>📜 Regolamento</h2>
        </div>
      </div>

      <div className="rulesList">
        <div className="ruleItem">
          <b>1.</b>
          <span>
            La sfida è composta da{" "}
            <strong>
              20 domande
            </strong>
            : 10 sulle partite e 10 sui
            giocatori.
          </span>
        </div>

        <div className="ruleItem">
          <b>2.</b>
          <span>
            Ogni risposta corretta vale{" "}
            <strong>10 punti</strong>.
          </span>
        </div>

        <div className="ruleItem">
          <b>3.</b>
          <span>
            Al termine del quiz si passa
            alla prova dei{" "}
            <strong>rigori</strong>.
          </span>
        </div>

        <div className="ruleItem">
          <b>4.</b>
          <span>
            La porta ha{" "}
            <strong>
              {Number(
                week?.rigoriCells || 12
              )}
              /12
            </strong>{" "}
            caselle. La possibilità di
            segnare diminuisce ogni due
            rigori, fino a un minimo di
            2/12.
          </span>
        </div>

        <div className="ruleItem">
          <b>5.</b>
          <span>
            Ogni gol aumenta il
            moltiplicatore di{" "}
            <strong>
              +
              {Number(
                week?.multiplierStep ||
                  0.15
              ).toFixed(2)}
            </strong>
            , partendo da{" "}
            <strong>
              x
              {Number(
                week?.multiplierBase || 1
              ).toFixed(2)}
            </strong>
            .
          </span>
        </div>

        <div className="ruleItem">
          <b>6.</b>
          <span>
            Un rigore parato{" "}
            <strong>
              termina la serie
            </strong>
            .
          </span>
        </div>

        <div className="ruleItem">
          <b>7.</b>
          <span>
            Il punteggio finale è dato dal
            punteggio del quiz
            moltiplicato per il
            moltiplicatore finale dei
            rigori.
          </span>
        </div>

        <div className="ruleItem">
          <b>8.</b>
          <span>
            Se una domanda ha più
            alternative corrette, è
            sufficiente scegliere{" "}
            <strong>
              una delle risposte indicate
            </strong>{" "}
            dall'organizzatore.
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HOME
   ========================================================= */

function Home({
  week,
  user,
  setPage,
  attempt,
}) {
  const state = getWeekState(week);

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
          Conosci il calcio. Indovina.
          Segna.
        </p>

        {state === "open" &&
          !attempt && (
            <button
              onClick={() =>
                setPage("quiz")
              }
            >
              GIOCA ORA →
            </button>
          )}

        {attempt &&
          !week?.results_published && (
            <div className="notice">
              Hai già partecipato.
              <br />
              Il risultato sarà
              disponibile dopo la
              pubblicazione.
            </div>
          )}

        {week?.results_published && (
          <button
            onClick={() =>
              setPage("rank")
            }
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
            {state === "open" &&
              "APERTA"}

            {state === "waiting" &&
              "IN ARRIVO"}

            {state === "closed" &&
              "CHIUSA"}

            {state === "published" &&
              "RISULTATI PUBBLICATI"}

            {state === "draft" &&
              "IN PREPARAZIONE"}

            {state === "none" &&
              "NESSUNA"}
          </span>
        </div>

        <div className="card">
          <small>
            IL TUO PROFILO
          </small>

          <strong>
            {user.name}
          </strong>

          <span>
            @{user.username}
          </span>
        </div>

      </div>

      {/* COUNTDOWN */}

      <Countdown week={week} />

      {/* REGOLAMENTO */}

      <RulesCard week={week} />

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

  const [index, setIndex] =
    useState(0);

  const [answers, setAnswers] =
    useState({});

  const [error, setError] =
    useState("");

  if (!week) {
    return (
      <div className="empty">
        Nessuna settimana disponibile.
      </div>
    );
  }

  const state =
    getWeekState(week);

  if (state !== "open") {
    return (
      <div className="empty">
        Questa settimana non è
        disponibile.
      </div>
    );
  }

  const question =
    questions[index];

  const choose = (answer) => {
    setAnswers({
      ...answers,
      [index]: answer,
    });

    setError("");
  };

  const previous = () => {
    if (index === 0) {
      return;
    }

    setIndex(index - 1);
    setError("");
  };

  const next = () => {
    if (!answers[index]) {
      setError(
        "Scegli una risposta."
      );

      return;
    }

    if (
      index ===
      questions.length - 1
    ) {
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

      onDone({
        matchAnswers,
        playerAnswers,
      });

      return;
    }

    setIndex(index + 1);
    setError("");
  };

  return (
    <div className="wrap">

      <div className="progress">
        DOMANDA {index + 1} /{" "}
        {questions.length}

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
          ).map(
            (option, i) => (
              <button
                key={i}
                className={
                  answers[index] ===
                  option
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
                    `Risposta ${
                      i + 1
                    }`}
                </span>
              </button>
            )
          )}
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
            disabled={index === 0}
          >
            ← INDIETRO
          </button>

          <button
            className="next"
            onClick={next}
          >
            {index ===
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
   ========================================================= */

function Rigori({
  week,
  onDone,
}) {
  const [shot, setShot] =
    useState(0);

  const [goals, setGoals] =
    useState(0);

  const [multiplier, setMultiplier] =
    useState(
      Number(
        week?.multiplierBase || 1
      )
    );

  const [saveCells, setSaveCells] =
    useState(() =>
      createRandomSaves(
        goalsAvailableForShot(0)
      )
    );

  const [selected, setSelected] =
    useState(null);

  const [result, setResult] =
    useState(null);

  const [finished, setFinished] =
    useState(false);

  const shoot = (cell) => {
    if (result || finished) {
      return;
    }

    const isGoal =
      !saveCells.has(cell);

    const newGoals =
      goals +
      (isGoal ? 1 : 0);

    const newMultiplier =
      Number(
        (
          multiplier +
          (isGoal
            ? Number(
                week?.multiplierStep ||
                  0.15
              )
            : 0)
        ).toFixed(2)
      );

    setSelected(cell);

    setResult({
      goal: isGoal,
      cell,
      multiplier:
        newMultiplier,
    });

    setGoals(newGoals);
    setMultiplier(
      newMultiplier
    );
  };

  const continueShot = () => {
    if (!result) {
      return;
    }

    if (!result.goal) {
      setFinished(true);

      onDone({
        goals,
        multiplier,
        history: {
          goals,
          shots: shot + 1,
          finalMultiplier:
            multiplier,
        },
      });

      return;
    }

    const nextShot =
      shot + 1;

    setShot(nextShot);
    setSelected(null);
    setResult(null);

    const nextGoalCount =
      goalsAvailableForShot(
        nextShot
      );

    setSaveCells(
      createRandomSaves(
        nextGoalCount
      )
    );
  };

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
          Non sai dove si trova la
          parata.
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
                  Boolean(result)
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
                ? `Moltiplicatore +${Number(
                    week?.multiplierStep ||
                      0.15
                  ).toFixed(2)}`
                : "La serie termina qui."}
            </p>

            <button
              onClick={
                continueShot
              }
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
   PARTECIPAZIONE COMPLETA
   ========================================================= */

function Completed({
  setPage,
}) {
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
          dopo la chiusura della
          settimana.
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
   REVISIONE RISPOSTE
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
    userAnswer,
    index
  ) => {
    const correctAnswers =
      getCorrectAnswers(
        question
      );

    const isCorrect =
      Boolean(
        userAnswer &&
          correctAnswers.includes(
            userAnswer
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
          question.id ||
          index
        }
      >
        <div className="reviewQuestionTop">
          <span>
            DOMANDA {index + 1}
          </span>

          <strong>
            {isCorrect
              ? "✓ CORRETTA"
              : "✗ ERRATA"}
          </strong>
        </div>

        <h3>
          {question.text ||
            "Domanda senza testo"}
        </h3>

        <div className="reviewAnswer">
          <small>
            LA TUA RISPOSTA
          </small>

          <strong>
            {userAnswer ||
              "Nessuna risposta"}
          </strong>
        </div>

        <div className="reviewCorrectAnswer">
          <small>
            RISPOSTA CORRETTA
            {correctAnswers.length >
            1
              ? " / RISPOSTE CORRETTE"
              : ""}
          </small>

          <strong>
            {correctAnswers.length
              ? correctAnswers.join(
                  " / "
                )
              : "Non ancora inserita"}
          </strong>
        </div>
      </div>
    );
  };

  return (
    <div className="reviewOverlay">
      <div className="reviewModal">

        <div className="reviewHeader">
          <div>
            <small>
              SETTIMANA #
              {week?.number}
            </small>

            <h2>
              Le tue risposte
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
          <strong>
            {attempt?.correct_answers ||
              0}
            /20 corrette
          </strong>

          <span>
            Punteggio quiz:{" "}
            {attempt?.base_score ||
              0}{" "}
            punti
          </span>

          <span>
            Rigori:{" "}
            {attempt?.goals || 0} gol
            · Moltiplicatore x
            {Number(
              attempt?.multiplier || 1
            ).toFixed(2)}
          </span>
        </div>

        <div className="reviewSection">
          <h3>
            ⚽ Domande partita
          </h3>

          {matchQuestions.map(
            (question, index) =>
              renderQuestion(
                question,
                matchAnswers[index],
                index
              )
          )}
        </div>

        <div className="reviewSection">
          <h3>
            👤 Domande giocatore
          </h3>

          {playerQuestions.map(
            (question, index) =>
              renderQuestion(
                question,
                playerAnswers[index],
                index + 10
              )
          )}
        </div>

        <button
          className="reviewBottomClose"
          onClick={onClose}
        >
          CHIUDI
        </button>

      </div>
    </div>
  );
}

/* =========================================================
   CLASSIFICA
   ========================================================= */

function Rank({
  week,
  attempts,
  user,
}) {
  const [reviewOpen, setReviewOpen] =
    useState(false);

  if (!week?.results_published) {
    return (
      <div className="wrap">

        <div className="title">
          <small>
            FANTALUCK
          </small>

          <h1>Classifica</h1>
        </div>

        <div className="empty">
          <div className="bigEmoji">
            🏆
          </div>

          <h2>
            Risultati non ancora
            pubblicati
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

  const rows = [...attempts]
    .filter(
      (a) =>
        a.results_published ===
          true ||
        week.results_published ===
          true
    )
    .sort(
      (a, b) =>
        Number(
          b.final_score || 0
        ) -
        Number(
          a.final_score || 0
        )
    );

  const myPublishedAttempt =
    rows.find(
      (attempt) =>
        attempt.username ===
        user.username
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
            const isCurrentPlayer =
              attempt.username ===
              user.username;

            return (
              <div
                className={
                  isCurrentPlayer
                    ? "row currentPlayer clickableRow"
                    : "row"
                }
                key={
                  attempt.username
                }
                onClick={() => {
                  if (
                    isCurrentPlayer
                  ) {
                    setReviewOpen(
                      true
                    );
                  }
                }}
                role={
                  isCurrentPlayer
                    ? "button"
                    : undefined
                }
                tabIndex={
                  isCurrentPlayer
                    ? 0
                    : undefined
                }
                onKeyDown={(event) => {
                  if (
                    isCurrentPlayer &&
                    (event.key ===
                      "Enter" ||
                      event.key ===
                        " ")
                  ) {
                    event.preventDefault();

                    setReviewOpen(
                      true
                    );
                  }
                }}
              >
                <b>
                  {index + 1}
                </b>

                <span>
                  <strong>
                    {attempt.name ||
                      attempt.username}
                  </strong>

                  <small>
                    {attempt.correct_answers ||
                      0}
                    /20 corrette ·{" "}
                    {attempt.goals ||
                      0}{" "}
                    gol

                    {isCurrentPlayer && (
                      <>
                        <br />
                        <em>
                          Clicca per rivedere
                          le tue risposte
                        </em>
                      </>
                    )}
                  </small>
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
            Nessun risultato
            disponibile.
          </div>
        )}

      </div>

      {reviewOpen &&
        myPublishedAttempt && (
          <AnswerReview
            week={week}
            attempt={
              myPublishedAttempt
            }
            onClose={() =>
              setReviewOpen(false)
            }
          />
        )}

    </div>
  );
}

/* =========================================================
   ADMIN - QUESTION EDITOR
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

    const options = [
      ...(next[questionIndex]
        .options || []),
    ];

    const oldValue =
      options[optionIndex];

    options[optionIndex] = value;

    /*
       Se modifichiamo il testo di una
       risposta, eliminiamo il vecchio
       valore dalle risposte corrette.
    */

    let correct =
      getCorrectAnswers(
        next[questionIndex]
      );

    if (
      oldValue &&
      oldValue !== value
    ) {
      correct = correct.filter(
        (answer) =>
          answer !== oldValue
      );
    }

    next[questionIndex] = {
      ...next[questionIndex],
      options,
      correct,
    };

    onChange(next);
  };

  const toggleCorrect = (
    questionIndex,
    option
  ) => {
    if (!option) return;

    const next = [...questions];

    const current =
      getCorrectAnswers(
        next[questionIndex]
      );

    const isAlreadyCorrect =
      current.includes(option);

    const correct =
      isAlreadyCorrect
        ? current.filter(
            (answer) =>
              answer !== option
          )
        : [...current, option];

    next[questionIndex] = {
      ...next[questionIndex],
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
                      key={
                        optionIndex
                      }
                      placeholder={`Risposta ${String.fromCharCode(
                        65 +
                          optionIndex
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
                  ✓ RISPOSTE CORRETTE
                </div>

                <p>
                  Puoi selezionare una o
                  più alternative corrette.
                </p>

                <div className="correctCheckboxes">

                  {question.options
                    ?.filter(Boolean)
                    .map(
                      (
                        option,
                        i
                      ) => (
                        <label
                          key={i}
                          className={
                            correctAnswers.includes(
                              option
                            )
                              ? "correctCheckbox checked"
                              : "correctCheckbox"
                          }
                        >
                          <input
                            type="checkbox"
                            checked={correctAnswers.includes(
                              option
                            )}
                            onChange={() =>
                              toggleCorrect(
                                index,
                                option
                              )
                            }
                          />

                          <span>
                            {String.fromCharCode(
                              65 + i
                            )}{" "}
                            — {option}
                          </span>
                        </label>
                      )
                    )}

                </div>

                {!correctAnswers.length && (
                  <div className="noCorrectAnswer">
                    Nessuna risposta corretta
                    selezionata.
                  </div>
                )}

                {correctAnswers.length >
                  0 && (
                  <div className="selectedCorrectInfo">
                    Selezionate:{" "}
                    <strong>
                      {correctAnswers.join(
                        " / "
                      )}
                    </strong>
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
  users,
  weeks,
  setUsers,
  setWeeks,
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

  const [userForm, setUserForm] =
    useState({
      username: "",
      password: "",
      name: "",
    });

  const [
    editingWeek,
    setEditingWeek,
  ] = useState(null);

  const [attempts, setAttempts] =
    useState([]);

  const selectedWeek = weeks.find(
    (w) =>
      w.id === selectedWeekId
  );

  /* -------------------------------------
     USERS
     ------------------------------------- */

  const addUser = async (
    event
  ) => {
    event.preventDefault();

    if (
      !userForm.username ||
      !userForm.password ||
      !userForm.name
    ) {
      return;
    }

    if (
      users.some(
        (u) =>
          u.username ===
          userForm.username.trim()
      )
    ) {
      setMessage(
        "Username già esistente."
      );

      return;
    }

    const user = {
      username:
        userForm.username.trim(),

      password:
        userForm.password,

      role: "participant",

      name:
        userForm.name.trim(),
    };

    const next = [
      ...users,
      user,
    ];

    await saveUsers(next);

    setUsers(next);

    setUserForm({
      username: "",
      password: "",
      name: "",
    });

    setMessage(
      "Giocatore aggiunto."
    );
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

    const next = users.filter(
      (u) =>
        u.username !== username
    );

    await saveUsers(next);

    setUsers(next);
  };

  /* -------------------------------------
     WEEKS
     ------------------------------------- */

  const createNewWeek = () => {
    const highest =
      weeks.length > 0
        ? Math.max(
            ...weeks.map(
              (w) =>
                Number(
                  w.number
                ) || 0
            )
          )
        : 0;

    const week = newWeek(
      highest + 1
    );

    setEditingWeek(week);
    setSelectedWeekId(
      week.id
    );
    setTab("editWeek");
  };

  const saveCurrentWeek =
    async () => {
      if (!editingWeek) {
        return;
      }

      setSaving(true);
      setMessage("");

      try {
        const normalizedWeek =
          {
            ...editingWeek,

            matchQuestions:
              normalizeQuestions(
                editingWeek.matchQuestions,
                "match"
              ),

            playerQuestions:
              normalizeQuestions(
                editingWeek.playerQuestions,
                "player"
              ),
          };

        await saveWeek(
          normalizedWeek
        );

        const exists =
          weeks.some(
            (w) =>
              w.id ===
              normalizedWeek.id
          );

        const next = exists
          ? weeks.map((w) =>
              w.id ===
              normalizedWeek.id
                ? normalizedWeek
                : w
            )
          : [
              ...weeks,
              normalizedWeek,
            ];

        setWeeks(next);
        setEditingWeek(
          normalizedWeek
        );

        setMessage(
          "Settimana salvata correttamente."
        );
      } catch (error) {
        console.error(error);

        setMessage(
          "Errore durante il salvataggio."
        );
      } finally {
        setSaving(false);
      }
    };

  const editWeek = (
    week
  ) => {
    setEditingWeek({
      ...week,

      matchQuestions:
        normalizeQuestions(
          week.matchQuestions,
          "match"
        ),

      playerQuestions:
        normalizeQuestions(
          week.playerQuestions,
          "player"
        ),
    });

    setSelectedWeekId(
      week.id
    );

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

    await deleteWeek(
      week.id
    );

    setWeeks(
      weeks.filter(
        (w) =>
          w.id !== week.id
      )
    );

    if (
      selectedWeekId ===
      week.id
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

    const updated = {
      ...week,
      status: nextStatus,
    };

    await saveWeek(
      updated
    );

    setWeeks(
      weeks.map((w) =>
        w.id === week.id
          ? updated
          : w
      )
    );
  };

  /* -------------------------------------
     RESULTS
     ------------------------------------- */

  const openResults = async (
    week
  ) => {
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
        questions.length ===
          20 &&
        questions.every(
          (q) =>
            getCorrectAnswers(
              q
            ).length > 0
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
          "Inserisci tutte le 20 risposte corrette prima di pubblicare."
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

      for (
        const attempt of currentAttempts
      ) {
        const score =
          calculateQuizScore(
            week,
            attempt.match_answers ||
              [],
            attempt.player_answers ||
              []
          );

        const rigori =
          attempt.rigori_result ||
          {};

        const multiplier =
          Number(
            rigori.multiplier ||
              attempt.multiplier ||
              1
          );

        const finalScore =
          Math.round(
            score.baseScore *
              multiplier
          );

        await updateAttempt(
          attempt.id,
          {
            base_score:
              score.baseScore,

            correct_answers:
              score.correct,

            goals:
              Number(
                rigori.goals ||
                  attempt.goals ||
                  0
              ),

            multiplier,

            final_score:
              finalScore,

            results_published:
              true,
          }
        );
      }

      const updatedWeek = {
        ...week,
        status: "published",
        results_published: true,
      };

      await saveWeek(
        updatedWeek
      );

      setWeeks(
        weeks.map((w) =>
          w.id === week.id
            ? updatedWeek
            : w
        )
      );

      setAttempts(
        await dbAttempts(
          week.id
        )
      );

      setMessage(
        "Risultati calcolati e pubblicati!"
      );
    };

  /* -------------------------------------
     RENDER
     ------------------------------------- */

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

      {/* ===============================
          WEEKS
          =============================== */}

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

      {/* ===============================
          USERS
          =============================== */}

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

            <button>
              AGGIUNGI
            </button>

          </form>

          <div className="table">

            {users.map(
              (user) => (
                <div
                  className="row"
                  key={
                    user.username
                  }
                >

                  <span>
                    <b>
                      {user.name}
                    </b>

                    <small>
                      @
                      {
                        user.username
                      }{" "}
                      ·{" "}
                      {
                        user.role
                      }
                    </small>
                  </span>

                  {user.role !==
                    "admin" && (
                    <button
                      className="danger"
                      onClick={() =>
                        removeUser(
                          user.username
                        )
                      }
                    >
                      ELIMINA
                    </button>
                  )}

                </div>
              )
            )}

          </div>
        </>
      )}

      {/* ===============================
          EDIT WEEK
          =============================== */}

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
                {
                  editingWeek.number
                }
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
                          e.target
                            .value
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
                        e.target
                          .value,
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
                        e.target
                          .value,
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
                💡 Puoi selezionare anche
                più risposte corrette per
                ogni domanda. Al momento
                della correzione, il
                partecipante riceverà i 10
                punti se avrà scelto una
                delle alternative corrette.
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

      {/* ===============================
          RESULTS
          =============================== */}

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
                Risultati — Settimana #
                {
                  selectedWeek.number
                }
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
                          Partecipazione
                          registrata
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

  const [users, setUsers] =
    useState([]);

  const [weeks, setWeeks] =
    useState([]);

  const [user, setUser] =
    useState(() =>
      localGet(
        "fl_session",
        null
      )
    );

  const [page, setPage] =
    useState("home");

  const [attempts, setAttempts] =
    useState([]);

  const [quizAnswers, setQuizAnswers] =
    useState(null);

  const [finished, setFinished] =
    useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [
          loadedUsers,
          loadedWeeks,
        ] = await Promise.all([
          dbUsers(),
          dbWeeks(),
        ]);

        /*
           Normalizziamo anche le settimane
           già presenti nel database.
        */

        const normalizedWeeks =
          loadedWeeks.map(
            (week) => ({
              ...week,

              matchQuestions:
                normalizeQuestions(
                  week.matchQuestions,
                  "match"
                ),

              playerQuestions:
                normalizeQuestions(
                  week.playerQuestions,
                  "player"
                ),
            })
          );

        setUsers(
          loadedUsers
        );

        setWeeks(
          normalizedWeeks
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /*
     Settimana attiva:
     viene scelta quella aperta.
     Se non c'è, mostriamo la più recente.
  */

  const activeWeek =
    weeks
      .filter(
        (week) =>
          getWeekState(
            week
          ) === "open"
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
    if (
      !activeWeek ||
      !user
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
    user?.username,
  ]);

  const myAttempt =
    attempts.find(
      (a) =>
        a.username ===
        user?.username
    );

  const finishQuiz = ({
    matchAnswers,
    playerAnswers,
  }) => {
    setQuizAnswers({
      matchAnswers,
      playerAnswers,
    });

    setPage("rigori");
  };

  const finishRigori =
    async (
      rigoriResult
    ) => {
      if (
        !activeWeek ||
        !user
      ) {
        return;
      }

      const attempt = {
        id: uid(),

        week_id:
          activeWeek.id,

        username:
          user.username,

        name:
          user.name,

        /*
           LE RISPOSTE VENGONO SALVATE.
           NON vengono ancora corrette.
        */

        match_answers:
          quizAnswers?.matchAnswers ||
          [],

        player_answers:
          quizAnswers?.playerAnswers ||
          [],

        /*
           RISULTATO RIGORI
        */

        rigori_result:
          rigoriResult,

        base_score: 0,

        correct_answers: 0,

        goals:
          Number(
            rigoriResult.goals ||
              0
          ),

        multiplier:
          Number(
            rigoriResult.multiplier ||
              1
          ),

        final_score: 0,

        results_published:
          false,

        created_at:
          new Date().toISOString(),
      };

      await saveAttempt(
        attempt
      );

      setAttempts(
        await dbAttempts(
          activeWeek.id
        )
      );

      setFinished(true);

      setPage(
        "completed"
      );
    };

  const logout = () => {
    localStorage.removeItem(
      "fl_session"
    );

    setUser(null);
    setPage("home");
    setAttempts([]);
    setQuizAnswers(null);
    setFinished(false);
  };

  if (loading) {
    return (
      <div className="loading">
        🍀
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        users={users}
        onLogin={(
          loggedUser
        ) => {
          setUser(
            loggedUser
          );

          localSet(
            "fl_session",
            loggedUser
          );

          setPage("home");
        }}
      />
    );
  }

  return (
    <>
      <header>
        <div className="brand">
          🍀 FANTALUCK
        </div>

        <span>
          {user.name}
        </span>
      </header>

      {page === "home" && (
        <Home
          week={activeWeek}
          user={user}
          setPage={setPage}
          attempt={myAttempt}
        />
      )}

      {page === "quiz" && (
        <Quiz
          week={activeWeek}
          onDone={
            finishQuiz
          }
        />
      )}

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
          user={user}
        />
      )}

      {page === "admin" &&
        user.role ===
          "admin" && (
          <Admin
            users={users}
            weeks={weeks}
            setUsers={
              setUsers
            }
            setWeeks={
              setWeeks
            }
          />
        )}

      <Nav
        page={page}
        setPage={setPage}
        user={user}
        onLogout={logout}
      />
    </>
  );
}

createRoot(
  document.getElementById(
    "root"
  )
).render(<App />);
