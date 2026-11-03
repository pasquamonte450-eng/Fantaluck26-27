import Icon from "../components/Icon";

export default function Completed({ setPage }) {
  return (
    <div className="wrap">
      <div className="completedCard">
        <div className="completedIcon">
          <Icon name="check" size={38} />
        </div>

        <h1>Partecipazione registrata!</h1>

        <p>Le tue risposte e il risultato dei rigori sono stati salvati.</p>

        <p>
          Il punteggio sarà calcolato e pubblicato dall'organizzatore dopo la
          chiusura della settimana.
        </p>

        <button onClick={() => setPage("home")}>TORNA ALLA HOME</button>
      </div>
    </div>
  );
}
