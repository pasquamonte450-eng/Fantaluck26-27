import { useState } from "react";
import Icon from "../components/Icon";
import { loginWithUsername } from "../services/auth";

export default function Login({ onLoggedIn, onRecovery }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError("Inserisci username e password.");
      return;
    }

    setLoading(true);

    try {
      await loginWithUsername(username, password);

      onLoggedIn();
    } catch (err) {
      console.error(err);

      setLoading(false);

      setError("Username o password non validi.");
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

        <p className="tag">LA SFIDA SETTIMANALE</p>

        <form onSubmit={submit}>
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

          <button type="submit" disabled={loading}>
            {loading ? "ACCESSO..." : "ENTRA"}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        <button
          type="button"
          className="loginRecoveryButton"
          onClick={onRecovery}
        >
          PASSWORD DIMENTICATA?
        </button>
      </div>
    </main>
  );
}
