import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import { dbPublicProfiles } from "../services/profiles";

export default function PronosticiRank({ profile, setPage }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await dbPublicProfiles();

        if (!cancelled) {
          setProfiles(data);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Impossibile caricare la classifica dei pronostici.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = [...profiles].sort((a, b) => {
    const diff =
      Number(b.pronostici_indovinati || 0) -
      Number(a.pronostici_indovinati || 0);

    if (diff !== 0) return diff;

    return String(a.name || a.username || "").localeCompare(
      String(b.name || b.username || "")
    );
  });

  return (
    <div className="wrap">
      <div className="title">
        <small>FANTALUCK</small>

        <h1>Pronostici</h1>

        <p className="rankingHint">Classifica dei pronostici indovinati.</p>
      </div>

      <div className="pronosticiRankingHeader">
        <div className="pronosticiRankingIcon">
          <Icon name="target" size={27} />
        </div>

        <div className="pronosticiRankingText">
          <strong>PRONOSTICI INDOVINATI</strong>

          <span>Tutti i giocatori</span>
        </div>
      </div>

      {loading && <div className="empty">Caricamento classifica...</div>}

      {error && !loading && <div className="error">{error}</div>}

      {!loading && !error && rows.length > 0 && (
        <div className="table pronosticiRankingTable">
          {rows.map((player, index) => {
            const isMine = player.username === profile?.username;

            return (
              <div
                className={
                  isMine
                    ? "row currentPlayer pronosticiRankingRow"
                    : "row pronosticiRankingRow"
                }
                key={player.id || player.username}
              >
                <b>{index + 1}</b>

                <span>
                  <strong>{player.name || player.username}</strong>

                  <small>@{player.username}</small>
                </span>

                <strong className="pronosticiRankingValue">
                  {Number(player.pronostici_indovinati || 0)}
                </strong>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && !rows.length && (
        <div className="empty">Nessun giocatore trovato.</div>
      )}

      <button className="backButton" onClick={() => setPage("home")}>
        <Icon name="arrow-left" size={16} />
        TORNA ALLA HOME
      </button>
    </div>
  );
}
