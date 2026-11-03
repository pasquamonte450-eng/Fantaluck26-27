import { useState } from "react";
import Icon from "../components/Icon";
import { completeInvite, loginWithUsername } from "../services/auth";

export default function InviteSetup({ token, onCompleted }) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setError("");

    const cleanUsername = username.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanUsername || !cleanName || !password) {
      setError("Compila tutti i campi.");
      return;
    }

    if (cleanUsername.length < 3) {
      setError("Lo username deve avere almeno 3 caratteri.");
      return;
    }

    if (!/^[a-z0-9_.]+$/.test(cleanUsername)) {
      setError(
        "Lo username può contenere solo lettere, numeri, punto e underscore."
      );
      return;
    }

    if (password.length < 6) {
      setError("La password deve avere almeno 6 caratteri.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Le due password non coincidono.");
      return;
    }

    setLoading(true);

    try {
      await completeInvite(token, cleanUsername, cleanName, password);

      await loginWithUsername(cleanUsername, password);

      onCompleted();
    } catch (err) {
      console.error(err);

      setError(err.message || "Impossibile creare l'account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login">
      <div className="loginCard">
        <div className="logo">
          <span className="logoIcon">
            <Icon name="target" size={25} />
          </span>

          FANTALUCK
        </div>

        <p className="tag">CREA IL TUO ACCOUNT</p>

        <div className="inviteIntro">
          <strong>Sei stato invitato a partecipare.</strong>

          <span>
            Scegli i tuoi dati di accesso. Dopo la registrazione utilizzerai
            solo username e password per entrare in Fantaluck.
          </span>
        </div>

        <form onSubmit={submit}>
          <input
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            placeholder="Ripeti password"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "CREAZIONE..." : "CREA ACCOUNT"}
          </button>
        </form>

        {error && <div className="error">{error}</div>}
      </div>
    </main>
  );
}
