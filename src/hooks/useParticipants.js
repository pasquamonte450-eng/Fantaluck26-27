import { useState } from "react";
import { callFunction } from "../services/api";
import { dbAllProfiles } from "../services/profiles";
import { updatePronostici } from "../services/pronostici";

/** Stato e azioni sugli account registrati (tab Utenti dell'admin). */
export default function useParticipants() {
  const [participants, setParticipants] = useState([]);
  const [pronosticiBusyId, setPronosticiBusyId] = useState(null);

  const reload = () =>
    dbAllProfiles().then(setParticipants).catch(console.error);

  const patchParticipant = (id, patch) =>
    setParticipants((current) =>
      current.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );

  const changePronostici = async (userId, delta) => {
    if (pronosticiBusyId) return;

    setPronosticiBusyId(userId);

    try {
      const data = await updatePronostici(userId, delta);

      if (data?.profile) {
        patchParticipant(data.profile.id, {
          pronostici_indovinati: data.profile.pronostici_indovinati,
        });
      }
    } catch (err) {
      alert(
        err.message || "Impossibile aggiornare i pronostici indovinati."
      );
    } finally {
      setPronosticiBusyId(null);
    }
  };

  const toggleUserBlock = async (username, currentlyBlocked) => {
    const action = currentlyBlocked ? "sbloccare" : "bloccare";

    const confirmed = window.confirm(`Vuoi ${action} ${username}?`);

    if (!confirmed) return;

    try {
      const data = await callFunction("bloccautente", {
        username,
        blocked: !currentlyBlocked,
      });

      if (data?.profile) {
        patchParticipant(data.profile.id, { blocked: data.profile.blocked });
      }
    } catch (err) {
      alert(err.message || "Impossibile modificare lo stato dell'account.");
    }
  };

  return {
    participants,
    pronosticiBusyId,
    reload,
    changePronostici,
    toggleUserBlock,
  };
}
