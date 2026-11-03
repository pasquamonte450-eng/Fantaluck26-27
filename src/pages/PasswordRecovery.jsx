import { useState } from "react";
import Icon from "../components/Icon";
import { requestPasswordRecovery } from "../services/auth";

export default function PasswordRecovery({ onBack }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (!username.trim()) {
      setError("Inserisci il tuo username.");
      return;
    }

    setLoading(true);

    try {
      await requestPasswordRecovery(username);

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Impossibile inviare il recupero password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login">
      <div className="loginCard">
        <div className="logo">
          <span className="logoIcon">
            <Icon name="lock" size={25} />
          </span>

          FANTALUCK
        </div>

        <p className="tag">RECUPERO PASSWORD</p>

        {!success ? (
          <>
            <p className="loginInfo">
              Inserisci il tuo username. Riceverai un'email all'indirizzo
              associato al tuo account.
            </p>

            <form onSubmit={submit}>
              <input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <button type="submit" disabled={loading}>
                {loading ? "INVIO..." : "INVIA EMAIL"}
              </button>
            </form>
          </>
        ) : (
          <div className="success">
            Se l'username è associato a un account, riceverai un'email con le
            istruzioni per reimpostare la password.
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <button type="button" className="backButton" onClick={onBack}>
          <Icon name="arrow-left" size={16} />
          TORNA AL LOGIN
        </button>
      </div>
    </main>
  );
}
