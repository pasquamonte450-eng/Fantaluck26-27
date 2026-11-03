import { useState } from "react";
import Icon from "../components/Icon";
import Countdown from "../components/Countdown";
import { RULES } from "../data/rules";
import { getWeekState } from "../utils/week";

const STATE_LABELS = {
  open: "APERTA",
  waiting: "IN ARRIVO",
  closed: "CHIUSA",
  published: "RISULTATI PUBBLICATI",
  draft: "IN PREPARAZIONE",
  none: "NESSUNA",
};

export default function Home({ week, profile, setPage, attempt }) {
  const state = getWeekState(week);

  const [rulesOpen, setRulesOpen] = useState(false);

  const blocked = profile?.blocked === true;

  const canPlay = state === "open" && !attempt && !blocked;

  return (
    <div className="wrap">
      {blocked && (
        <div className="blockedBanner">
          <div>
            <strong>ACCOUNT BLOCCATO</strong>

            <span>
              Puoi consultare Fantaluck, ma non puoi partecipare alle sfide.
            </span>
          </div>
        </div>
      )}

      <section className="hero">
        <div className="badge">
          <Icon name="target" size={16} />
          FANTALUCK
        </div>

        <h1>
          La sfida
          <br />
          <em>settimanale.</em>
        </h1>

        <p>Conosci il calcio. Indovina. Segna.</p>

        {canPlay && (
          <button onClick={() => setPage("quiz")}>
            GIOCA ORA <Icon name="arrow" size={18} />
          </button>
        )}

        {blocked && state === "open" && (
          <div className="notice blockedNotice">
            <strong>Partecipazione disabilitata</strong>
            <br />
            Il tuo account è bloccato.
          </div>
        )}

        {attempt && (
          <div className="notice">
            Hai già partecipato.
            <br />
            Puoi consultare il tuo risultato e la classifica.
          </div>
        )}

        {state === "waiting" && (
          <div className="notice">La nuova sfida non è ancora iniziata.</div>
        )}

        {state === "closed" && !week?.results_published && (
          <div className="notice">
            La settimana è chiusa.
            <br />I risultati saranno pubblicati dall'organizzatore.
          </div>
        )}

        {week?.results_published && (
          <button onClick={() => setPage("rank")}>
            VEDI RISULTATI <Icon name="arrow" size={18} />
          </button>
        )}
      </section>

      <div className="grid2">
        <div className="card">
          <small>SETTIMANA</small>

          <strong>#{week?.number ?? "-"}</strong>

          <span>{STATE_LABELS[state]}</span>
        </div>

        <div className="card">
          <small>IL TUO PROFILO</small>

          <strong>{profile.name}</strong>

          <span>@{profile.username}</span>
        </div>

        <div className="card pronosticiCard">
          <div className="pronosticiCardTop">
            <small>PRONOSTICI INDOVINATI</small>

            <button
              type="button"
              className="pronosticiDashboardButton"
              onClick={() => setPage("pronostici")}
              aria-label="Apri classifica pronostici"
              title="Classifica pronostici"
            >
              <Icon name="target" size={20} />
            </button>
          </div>

          <strong>{Number(profile.pronostici_indovinati || 0)}</strong>

          <span>pronostici corretti</span>
        </div>
      </div>

      <Countdown week={week} />

      <button className="rulesToggle" onClick={() => setRulesOpen(!rulesOpen)}>
        <span>
          <small>FANTALUCK</small>

          <strong>REGOLAMENTO</strong>
        </span>

        <span className={rulesOpen ? "rulesArrow open" : "rulesArrow"}>
          <Icon name="chevron" size={18} />
        </span>
      </button>

      {rulesOpen && (
        <div className="rulesCard">
          <div className="rulesList">
            {RULES.map((rule, index) => (
              <div className="ruleItem" key={index}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
