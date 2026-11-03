export default function BlockedPage({ setPage }) {
  return (
    <div className="wrap">
      <div className="empty blockedPage">
        <div className="blockedBigIcon">ACCOUNT BLOCCATO</div>

        <h2>Account bloccato</h2>

        <p>
          Puoi continuare a consultare Fantaluck, ma non puoi partecipare alla
          sfida.
        </p>

        <button onClick={() => setPage("home")}>TORNA ALLA HOME</button>
      </div>
    </div>
  );
}
