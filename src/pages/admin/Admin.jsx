import { useState } from "react";
import AdminWeeksTab from "./AdminWeeksTab";
import AdminUsersTab from "./AdminUsersTab";
import AdminWeekEditor from "./AdminWeekEditor";
import AdminResults from "./AdminResults";
import { dbAttempts, updateAttempt } from "../../services/attempts";
import { deleteWeek, saveWeek } from "../../services/weeks";
import { getCorrectAnswers } from "../../utils/questions";
import { computeAttemptScore } from "../../utils/scoring";
import { getWeekState, newWeek, normalizeWeek } from "../../utils/week";

const weekQuestions = (week) => [
  ...(week.matchQuestions || []),
  ...(week.playerQuestions || []),
];

const allAnswersInserted = (week) => {
  const questions = weekQuestions(week);

  return (
    questions.length === 20 &&
    questions.every((q) => getCorrectAnswers(q).length > 0)
  );
};

export default function Admin({ weeks, reloadWeeks }) {
  const [tab, setTab] = useState("weeks");
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const [editingWeek, setEditingWeek] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selectedWeek = weeks.find((w) => w.id === selectedWeekId);

  /* ------------------------------ settimane ------------------------------ */

  const createNewWeek = () => {
    const highest = weeks.length
      ? Math.max(...weeks.map((w) => Number(w.number) || 0))
      : 0;

    const week = newWeek(highest + 1);

    setEditingWeek(week);
    setSelectedWeekId(week.id);
    setTab("editWeek");
  };

  const editWeek = (week) => {
    setEditingWeek(normalizeWeek(week));
    setSelectedWeekId(week.id);
    setTab("editWeek");
  };

  const saveCurrentWeek = async () => {
    if (!editingWeek) return;

    setSaving(true);
    setMessage("");

    try {
      const normalizedWeek = normalizeWeek(editingWeek);

      await saveWeek(normalizedWeek);

      await reloadWeeks();

      setEditingWeek(normalizedWeek);

      setMessage("Settimana salvata correttamente.");
    } catch (err) {
      console.error(err);

      setMessage("Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  const removeWeek = async (week) => {
    if (!window.confirm(`Eliminare la Settimana #${week.number}?`)) {
      return;
    }

    await deleteWeek(week.id);

    await reloadWeeks();

    if (selectedWeekId === week.id) {
      setSelectedWeekId(null);
      setEditingWeek(null);
    }
  };

  const toggleWeek = async (week) => {
    const nextStatus = getWeekState(week) === "open" ? "closed" : "open";

    await saveWeek({
      ...week,
      status: nextStatus,
    });

    await reloadWeeks();
  };

  /* ------------------------------- risultati ------------------------------ */

  const openResults = async (week) => {
    setSelectedWeekId(week.id);

    setAttempts(await dbAttempts(week.id));

    setTab("results");
  };

  const calculateAndPublish = async (week) => {
    if (!allAnswersInserted(week)) {
      alert(
        "Inserisci almeno una risposta corretta per tutte le 20 domande prima di pubblicare."
      );

      return;
    }

    const currentAttempts = await dbAttempts(week.id);

    if (!currentAttempts.length) {
      alert("Nessun giocatore ha ancora partecipato.");

      return;
    }

    const notFinished = currentAttempts.filter((a) => !a.rigori_finished);

    if (notFinished.length) {
      const proceed = window.confirm(
        `${notFinished.length} giocatore/i non ha ancora terminato i rigori. Vuoi pubblicare comunque escludendo loro dal calcolo del punteggio?`
      );

      if (!proceed) return;
    }

    const questions = weekQuestions(week);

    for (const attempt of currentAttempts) {
      if (!attempt.rigori_finished) {
        continue;
      }

      await updateAttempt(attempt.id, {
        ...computeAttemptScore(attempt, questions),
        results_published: true,
      });
    }

    await saveWeek({
      ...week,
      status: "published",
      results_published: true,
    });

    await reloadWeeks();

    setAttempts(await dbAttempts(week.id));

    setMessage("Risultati calcolati e pubblicati!");
  };

  /* --------------------------------- render ------------------------------- */

  return (
    <div className="wrap">
      <div className="title">
        <small>CONTROL ROOM</small>

        <h1>Admin</h1>
      </div>

      <div className="tabs">
        <button
          className={tab === "weeks" ? "on" : ""}
          onClick={() => setTab("weeks")}
        >
          Settimane
        </button>

        <button
          className={tab === "users" ? "on" : ""}
          onClick={() => setTab("users")}
        >
          Utenti
        </button>
      </div>

      {message && <div className="success">{message}</div>}

      {tab === "weeks" && (
        <AdminWeeksTab
          weeks={weeks}
          onCreate={createNewWeek}
          onEdit={editWeek}
          onResults={openResults}
          onToggle={toggleWeek}
          onRemove={removeWeek}
        />
      )}

      {tab === "users" && <AdminUsersTab setMessage={setMessage} />}

      {tab === "editWeek" && editingWeek && (
        <AdminWeekEditor
          week={editingWeek}
          setWeek={setEditingWeek}
          saving={saving}
          onSave={saveCurrentWeek}
          onBack={() => setTab("weeks")}
        />
      )}

      {tab === "results" && selectedWeek && (
        <AdminResults
          week={selectedWeek}
          attempts={attempts}
          onBack={() => setTab("weeks")}
          onEditAnswers={editWeek}
          onPublish={calculateAndPublish}
        />
      )}
    </div>
  );
}
