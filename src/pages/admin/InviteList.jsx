import Icon from "../../components/Icon";
import {
  formatInviteDate,
  inviteStatusClass,
  inviteStatusLabel,
} from "../../utils/invites";

/** Elenco degli inviti con azioni "genera/rigenera link" e "revoca". */
export default function InviteList({
  invites,
  loading,
  inviteUrl,
  copied,
  actionId,
  lastGeneratedInviteId,
  onGenerateLink,
  onRevoke,
  onCopy,
}) {
  if (loading) {
    return <div className="empty">Caricamento inviti...</div>;
  }

  return (
    <div className="table">
      {invites.map((invite) => {
        const pending = invite.status === "pending";

        const active = lastGeneratedInviteId === invite.id && inviteUrl;

        const actionBusy = actionId === invite.id;

        return (
          <div
            className="row"
            key={invite.id}
            style={{ alignItems: "center", gap: "16px", flexWrap: "wrap" }}
          >
            <span style={{ flex: "1 1 260px", minWidth: "0" }}>
              <b style={{ display: "block", wordBreak: "break-word" }}>
                {invite.email}
              </b>

              <small style={{ display: "block", marginTop: "4px" }}>
                Creato: {formatInviteDate(invite.created_at)}
              </small>

              <small style={{ display: "block", marginTop: "3px" }}>
                Scadenza: {formatInviteDate(invite.expires_at)}
              </small>

              {invite.used_at && (
                <small style={{ display: "block", marginTop: "3px" }}>
                  Utilizzato: {formatInviteDate(invite.used_at)}
                </small>
              )}
            </span>

            <span
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                minWidth: "110px",
              }}
            >
              <small
                className={inviteStatusClass(invite.status)}
                style={{ display: "inline-flex", width: "fit-content" }}
              >
                {inviteStatusLabel(invite.status)}
              </small>
            </span>

            {pending && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginLeft: "auto",
                }}
              >
                <button
                  type="button"
                  onClick={() => onGenerateLink(invite, Boolean(active))}
                  disabled={actionBusy}
                >
                  {actionBusy
                    ? "ATTENDI..."
                    : active
                    ? "RIGENERA LINK"
                    : "GENERA LINK"}
                </button>

                <button
                  type="button"
                  className="danger"
                  onClick={() => onRevoke(invite)}
                  disabled={actionBusy}
                >
                  REVOCA
                </button>
              </div>
            )}

            {active && (
              <div
                style={{
                  flex: "1 1 100%",
                  display: "flex",
                  gap: "8px",
                  width: "100%",
                  marginTop: "4px",
                }}
              >
                <input
                  value={inviteUrl}
                  readOnly
                  onFocus={(e) => e.target.select()}
                  style={{ flex: "1", minWidth: "0" }}
                />

                <button type="button" onClick={onCopy}>
                  <Icon name="copy" size={16} />

                  {copied ? "COPIATO" : "COPIA"}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {!invites.length && <div className="empty">Nessun invito presente.</div>}
    </div>
  );
}
