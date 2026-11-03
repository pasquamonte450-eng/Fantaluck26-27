import Icon from "../../components/Icon";

/** Form "Genera invito" + riquadro con il link appena creato. */
export default function InviteCard({
  email,
  setEmail,
  busy,
  error,
  url,
  copied,
  onSubmit,
  onCopy,
}) {
  return (
    <div className="adminInviteCard">
      <div className="adminInviteHeader">
        <div className="adminInviteIcon">
          <Icon name="mail" size={25} />
        </div>

        <div>
          <small>NUOVO PARTECIPANTE</small>

          <h2>Genera invito</h2>
        </div>
      </div>

      <p>
        Inserisci l'email del partecipante. Verrà generato un link personale
        valido per 7 giorni.
      </p>

      <form className="adminForm" onSubmit={onSubmit}>
        <input
          type="email"
          placeholder="Email del partecipante"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button disabled={busy}>
          {busy ? "GENERAZIONE..." : "GENERA INVITO"}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {url && (
        <div className="inviteResult">
          <div className="inviteResultHeader">
            <strong>INVITO PRONTO</strong>

            <span>Invia questo link al partecipante.</span>
          </div>

          <div className="inviteLinkBox">
            <input value={url} readOnly onFocus={(e) => e.target.select()} />

            <button type="button" onClick={onCopy}>
              <Icon name="copy" size={17} />

              {copied ? "COPIATO" : "COPIA"}
            </button>
          </div>

          <div className="inviteWarning">
            Il link è personale. Non pubblicarlo nel gruppo.
          </div>
        </div>
      )}
    </div>
  );
}
