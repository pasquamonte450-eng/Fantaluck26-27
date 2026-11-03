import { useState } from "react";
import { createInvite, manageInvites } from "../services/invites";

/**
 * Stato e azioni per la gestione degli inviti (tab Utenti dell'admin).
 * `setMessage` mostra i messaggi di successo nella barra dell'admin.
 */
export default function useInvites(setMessage) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [inviteActionId, setInviteActionId] = useState("");
  const [lastGeneratedInviteId, setLastGeneratedInviteId] = useState("");

  const flashCopied = () => {
    setInviteCopied(true);

    setTimeout(() => setInviteCopied(false), 1800);
  };

  const reload = async () => {
    setInvitesLoading(true);

    try {
      const data = await manageInvites("list");

      const list = data?.invites || [];

      setInvites(list);

      return list;
    } catch (err) {
      console.error(err);

      setInviteError(err.message || "Impossibile caricare gli inviti.");

      return [];
    } finally {
      setInvitesLoading(false);
    }
  };

  /** Azzera link e stato "copiato" (usato dopo l'eliminazione di un utente). */
  const resetLink = () => {
    setInviteUrl("");
    setLastGeneratedInviteId("");
    setInviteCopied(false);
  };

  const generateInvite = async (event) => {
    event.preventDefault();

    setInviteError("");
    setInviteCopied(false);
    setInviteUrl("");
    setLastGeneratedInviteId("");

    const email = inviteEmail.trim().toLowerCase();

    if (!email) {
      setInviteError("Inserisci un indirizzo email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setInviteError("Inserisci un indirizzo email valido.");
      return;
    }

    setInviteBusy(true);

    try {
      const data = await createInvite(email);

      if (!data?.invite_url) {
        throw new Error("Il link di invito non è stato generato.");
      }

      setInviteUrl(data.invite_url);

      setInviteEmail("");

      setMessage("Invito creato. Copia il link e invialo al partecipante.");

      try {
        const refreshed = await manageInvites("list");

        const list = refreshed?.invites || [];

        setInvites(list);

        const createdInvite = data?.invite?.id
          ? list.find((item) => item.id === data.invite.id)
          : list.find(
              (item) =>
                String(item.email || "").toLowerCase() === email &&
                item.status === "pending"
            );

        if (createdInvite) {
          setLastGeneratedInviteId(createdInvite.id);
        }
      } catch (listErr) {
        console.error("Invito creato ma lista non aggiornata:", listErr);
      }
    } catch (err) {
      setInviteError(err.message || "Impossibile creare l'invito.");
    } finally {
      setInviteBusy(false);
    }
  };

  const generateInviteLink = async (invite, regenerate = false) => {
    if (!invite?.id || invite.status !== "pending") {
      return;
    }

    setInviteError("");
    setInviteCopied(false);
    setInviteActionId(invite.id);

    try {
      const data = await manageInvites(
        regenerate ? "regenerate_link" : "generate_link",
        { invite_id: invite.id }
      );

      if (!data?.invite_url) {
        throw new Error("Il link di invito non è stato generato.");
      }

      setInviteUrl(data.invite_url);

      setLastGeneratedInviteId(invite.id);

      setMessage(
        regenerate
          ? "Link rigenerato. Il precedente link non è più valido."
          : "Link generato. Copialo e invialo al partecipante."
      );

      try {
        await navigator.clipboard.writeText(data.invite_url);

        flashCopied();
      } catch {
        // il link resta comunque disponibile nel riquadro
      }

      await reload();
    } catch (err) {
      setInviteError(err.message || "Impossibile generare il link.");
    } finally {
      setInviteActionId("");
    }
  };

  const revokeInvite = async (invite) => {
    if (!invite?.id || invite.status !== "pending") {
      return;
    }

    const confirmed = window.confirm(
      `Vuoi revocare l'invito per ${invite.email}?`
    );

    if (!confirmed) return;

    setInviteError("");
    setInviteActionId(invite.id);

    try {
      await manageInvites("revoke", { invite_id: invite.id });

      if (lastGeneratedInviteId === invite.id) {
        resetLink();
      }

      await reload();

      setMessage("Invito revocato correttamente.");
    } catch (err) {
      setInviteError(err.message || "Impossibile revocare l'invito.");
    } finally {
      setInviteActionId("");
    }
  };

  const copyInvite = async () => {
    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);

      flashCopied();
    } catch {
      window.prompt("Copia questo link:", inviteUrl);
    }
  };

  return {
    inviteEmail,
    setInviteEmail,
    inviteUrl,
    inviteBusy,
    inviteError,
    inviteCopied,
    invites,
    invitesLoading,
    inviteActionId,
    lastGeneratedInviteId,
    reload,
    resetLink,
    generateInvite,
    generateInviteLink,
    revokeInvite,
    copyInvite,
  };
}
