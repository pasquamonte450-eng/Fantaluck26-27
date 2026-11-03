/** Elenco degli account registrati con azioni admin. */
export default function ParticipantList({
  participants,
  pronosticiBusyId,
  onChangePronostici,
  onToggleBlock,
  onRemove,
}) {
  return (
    <div className="table">
      {participants.map((p) => (
        <div className="row adminUserRow" key={p.username}>
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
              {p.blocked ? "ACCOUNT BLOCCATO" : "ACCOUNT ATTIVO"}
            </small>

            <small className="adminPronosticiLabel">
              PRONOSTICI INDOVINATI
            </small>

            <strong className="adminPronosticiValue">
              {Number(p.pronostici_indovinati || 0)}
            </strong>
          </span>

          {p.role !== "admin" && (
            <div className="adminUserActions">
              <div className="pronosticiControls">
                <button
                  type="button"
                  className="pronosticiButton"
                  onClick={() => onChangePronostici(p.id, 1)}
                  disabled={pronosticiBusyId === p.id}
                  title="Aumenta"
                >
                  ▲
                </button>

                <button
                  type="button"
                  className="pronosticiButton"
                  onClick={() => onChangePronostici(p.id, -1)}
                  disabled={
                    pronosticiBusyId === p.id ||
                    Number(p.pronostici_indovinati || 0) <= 0
                  }
                  title="Diminuisci"
                >
                  ▼
                </button>
              </div>

              <button
                type="button"
                className={
                  p.blocked ? "userBlockButton unblock" : "userBlockButton"
                }
                onClick={() => onToggleBlock(p.username, Boolean(p.blocked))}
              >
                {p.blocked ? "SBLOCCA" : "BLOCCA"}
              </button>

              <button
                type="button"
                className="danger"
                onClick={() => onRemove(p.username)}
              >
                ELIMINA
              </button>
            </div>
          )}
        </div>
      ))}

      {!participants.length && (
        <div className="empty">Nessun giocatore trovato.</div>
      )}
    </div>
  );
}
