import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

import Icon from "./components/Icon";
import Nav from "./components/Nav";

import Login from "./pages/Login";
import PasswordRecovery from "./pages/PasswordRecovery";
import PasswordUpdate from "./pages/PasswordUpdate";
import InviteSetup from "./pages/InviteSetup";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import BlockedPage from "./pages/BlockedPage";
import Rigori from "./pages/Rigori";
import Completed from "./pages/Completed";
import Rank from "./pages/Rank";
import PronosticiRank from "./pages/PronosticiRank";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Admin from "./pages/admin/Admin";

import { callFunction } from "./services/api";
import { dbProfile } from "./services/profiles";
import { dbWeeksAdmin, dbWeeksPublic } from "./services/weeks";
import { dbAllAttempts, dbAttempts } from "./services/attempts";
import { mergeAttempts } from "./utils/attempts";
import { getWeekState } from "./utils/week";

const byNumberDesc = (a, b) => Number(b.number) - Number(a.number);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [page, setPage] = useState("home");
  const [attempts, setAttempts] = useState([]);
  const [allAttempts, setAllAttempts] = useState([]);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const isAdmin = profile?.role === "admin";

  const reloadWeeks = async () => {
    const data = isAdmin ? await dbWeeksAdmin() : await dbWeeksPublic();

    setWeeks(data);
  };

  /* -------------------------------------------------------
     INVITO / RECUPERO
  ------------------------------------------------------- */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get("invite");

    if (token) {
      setInviteToken(token);
    }
  }, []);

  /* -------------------------------------------------------
     SESSIONE
  ------------------------------------------------------- */

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);

        if (event === "PASSWORD_RECOVERY") {
          setPasswordRecovery(true);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  /* -------------------------------------------------------
     PROFILO + SETTIMANE
  ------------------------------------------------------- */

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setWeeks([]);
      setAttempts([]);
      setAllAttempts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);

    (async () => {
      try {
        const loadedProfile = await dbProfile(session.user.id);

        if (cancelled) return;

        setProfile(loadedProfile);

        const data =
          loadedProfile.role === "admin"
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
    weeks.filter((week) => getWeekState(week) === "open").sort(byNumberDesc)[0] ||
    [...weeks].sort(byNumberDesc)[0];

  /* -------------------------------------------------------
     TENTATIVI SETTIMANA ATTIVA
  ------------------------------------------------------- */

  useEffect(() => {
    if (!activeWeek || !profile) {
      return;
    }

    dbAttempts(activeWeek.id).then(setAttempts).catch(console.error);
  }, [activeWeek?.id, profile?.username]);

  /* -------------------------------------------------------
     TUTTE LE PARTECIPAZIONI
  ------------------------------------------------------- */

  useEffect(() => {
    if (!profile) return;

    let cancelled = false;

    dbAllAttempts()
      .then((data) => {
        if (!cancelled) {
          setAllAttempts(data || []);
        }
      })
      .catch((err) => {
        console.error("Dati partecipazioni non disponibili:", err);

        if (!cancelled) {
          setAllAttempts([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [profile?.username]);

  const combinedAttempts = useMemo(
    () => mergeAttempts(allAttempts, attempts),
    [allAttempts, attempts]
  );

  const myAttempt = attempts.find((a) => a.username === profile?.username);

  /* -------------------------------------------------------
     RICARICA TENTATIVI DOPO QUIZ / RIGORI
  ------------------------------------------------------- */

  const refreshAttempts = async () => {
    const refreshed = await dbAttempts(activeWeek.id);

    setAttempts(refreshed);

    setAllAttempts((current) => mergeAttempts(current, refreshed));
  };

  /* -------------------------------------------------------
     FINE QUIZ
  ------------------------------------------------------- */

  const finishQuiz = async ({ matchAnswers, playerAnswers }) => {
    if (profile?.blocked) {
      throw new Error("ACCOUNT BLOCCATO");
    }

    await callFunction("start-attempt", {
      week_id: activeWeek.id,
      match_answers: matchAnswers,
      player_answers: playerAnswers,
    });

    await refreshAttempts();

    setPage("rigori");
  };

  /* -------------------------------------------------------
     FINE RIGORI
  ------------------------------------------------------- */

  const finishRigori = async () => {
    await refreshAttempts();

    setPage("completed");
  };

  /* -------------------------------------------------------
     LOGOUT
  ------------------------------------------------------- */

  const logout = async () => {
    await supabase.auth.signOut();

    setPage("home");
    setAttempts([]);
    setAllAttempts([]);
    setProfile(null);
    setSession(null);
    setPasswordRecovery(false);
  };

  /* -------------------------------------------------------
     CONFIGURAZIONE
  ------------------------------------------------------- */

  if (!supabase) {
    return (
      <div className="empty">
        <h2>Configurazione mancante</h2>

        <p>
          Imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY per usare
          Fantaluck.
        </p>
      </div>
    );
  }

  /*
   * Se siamo arrivati dal link di invito,
   * mostriamo prima la pagina di creazione dell'account.
   */
  if (inviteToken && !session?.user) {
    return (
      <InviteSetup
        token={inviteToken}
        onCompleted={() => {
          const url = new URL(window.location.href);

          url.searchParams.delete("invite");

          window.history.replaceState({}, "", url.toString());

          setInviteToken("");
        }}
      />
    );
  }

  /*
   * Recupero password: quando Supabase segnala PASSWORD_RECOVERY
   * la sessione resta disponibile per la pagina di aggiornamento password.
   */
  if (passwordRecovery && session?.user) {
    return (
      <PasswordUpdate
        onCompleted={async () => {
          setPasswordRecovery(false);

          await supabase.auth.signOut();

          setSession(null);
          setProfile(null);
        }}
      />
    );
  }

  if (recoveryMode) {
    return <PasswordRecovery onBack={() => setRecoveryMode(false)} />;
  }

  if (loading) {
    return (
      <div className="loading">
        <Icon name="target" size={38} />
      </div>
    );
  }

  if (!session?.user || !profile) {
    return (
      <Login
        onLoggedIn={() => {}}
        onRecovery={() => setRecoveryMode(true)}
      />
    );
  }

  /* -------------------------------------------------------
     APP
  ------------------------------------------------------- */

  return (
    <>
      <header>
        <div className="brand">
          <Icon name="target" size={22} />
          FANTALUCK
        </div>

        <span>{profile.name}</span>
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
        (profile.blocked ? (
          <BlockedPage setPage={setPage} />
        ) : myAttempt ? (
          <div className="empty">Hai già partecipato a questa settimana.</div>
        ) : (
          <Quiz week={activeWeek} onDone={finishQuiz} />
        ))}

      {page === "rigori" && <Rigori week={activeWeek} onDone={finishRigori} />}

      {page === "completed" && <Completed setPage={setPage} />}

      {page === "rank" && (
        <Rank
          week={activeWeek}
          weeks={weeks}
          allAttempts={combinedAttempts}
          profile={profile}
        />
      )}

      {page === "pronostici" && (
        <PronosticiRank profile={profile} setPage={setPage} />
      )}

      {page === "profile" && (
        <Profile
          profile={profile}
          attempts={combinedAttempts}
          allWeeks={weeks}
          setPage={setPage}
        />
      )}

      {page === "history" && (
        <History
          profile={profile}
          attempts={combinedAttempts}
          weeks={weeks}
          setPage={setPage}
        />
      )}

      {page === "admin" && isAdmin && (
        <Admin weeks={weeks} reloadWeeks={reloadWeeks} />
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
