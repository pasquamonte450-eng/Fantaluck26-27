import { useEffect } from "react";
import InviteCard from "./InviteCard";
import InviteList from "./InviteList";
import ParticipantList from "./ParticipantList";
import useInvites from "../../hooks/useInvites";
import useParticipants from "../../hooks/useParticipants";
import { callFunction } from "../../services/api";

export default function AdminUsersTab({ setMessage }) {
  const invites = useInvites(setMessage);
  const participants = useParticipants();

  useEffect(() => {
    participants.reload();
    invites.reload();
  }, []);

  const removeUser = async (username) => {
    if (!window.confirm("Vuoi eliminare questo giocatore?")) {
      return;
    }

    try {
      await callFunction("togliutente", { username });

      await participants.reload();

      /*
       * Dopo l'eliminazione aggiorniamo anche la lista degli inviti:
       * la Edge Function "togliutente" elimina gli inviti associati
       * all'account, quindi l'invito "USATO" non deve più restare visibile.
       */
      await invites.reload();

      invites.resetLink();

      setMessage(
        "Giocatore eliminato. L'email è nuovamente disponibile per un nuovo invito."
      );
    } catch (err) {
      alert(err.message || "Impossibile eliminare il giocatore.");
    }
  };

  return (
    <>
      <InviteCard
        email={invites.inviteEmail}
        setEmail={invites.setInviteEmail}
        busy={invites.inviteBusy}
        error={invites.inviteError}
        url={invites.inviteUrl}
        copied={invites.inviteCopied}
        onSubmit={invites.generateInvite}
        onCopy={invites.copyInvite}
      />

      <div className="adminUsersTitle">
        <small>INVITI</small>

        <strong>Inviti ai partecipanti</strong>
      </div>

      {invites.inviteError && !invites.inviteUrl && (
        <div className="error">{invites.inviteError}</div>
      )}

      <InviteList
        invites={invites.invites}
        loading={invites.invitesLoading}
        inviteUrl={invites.inviteUrl}
        copied={invites.inviteCopied}
        actionId={invites.inviteActionId}
        lastGeneratedInviteId={invites.lastGeneratedInviteId}
        onGenerateLink={invites.generateInviteLink}
        onRevoke={invites.revokeInvite}
        onCopy={invites.copyInvite}
      />

      <div className="adminUsersTitle">
        <small>PARTECIPANTI</small>

        <strong>Account registrati</strong>
      </div>

      <ParticipantList
        participants={participants.participants}
        pronosticiBusyId={participants.pronosticiBusyId}
        onChangePronostici={participants.changePronostici}
        onToggleBlock={participants.toggleUserBlock}
        onRemove={removeUser}
      />
    </>
  );
}
