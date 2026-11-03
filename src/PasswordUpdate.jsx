import { useState } from "react";
import Icon from "../components/Icon";
import { supabase } from "../supabase";

export default function PasswordUpdate({ onCompleted }) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setError("");

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
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      alert(
        "Password aggiornata correttamente. Ora puoi accedere con la nuova password."
      );

      await onCompleted();
    } catch (err) {
      console.error(err);

      setError(err.message || "Impossibile aggiornare la password.");
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

        <p className="tag">NUOVA PASSWORD</p>

        <div className="inviteIntro">
          <strong>Reimposta la tua password.</strong>

          <span>Scegli una nuova password per il tuo account.</span>
        </div>

        <form onSubmit={submit}>
          <input
            type="password"
            placeholder="Nuova password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Ripeti password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "SALVATAGGIO..." : "SALVA PASSWORD"}
          </button>
        </form>

        {error && <div className="error">{error}</div>}
      </div>
    </main>
  );
}
