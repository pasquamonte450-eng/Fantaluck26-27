import { getCorrectAnswers } from "../../utils/questions";

export default function QuestionEditor({ title, questions, onChange }) {
  const updateQuestion = (index, field, value) => {
    const next = [...questions];

    next[index] = {
      ...next[index],
      [field]: value,
    };

    onChange(next);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const next = [...questions];

    const currentQuestion = next[questionIndex];

    const options = [...(currentQuestion.options || [])];

    const oldValue = options[optionIndex];

    options[optionIndex] = value;

    let correct = getCorrectAnswers(currentQuestion);

    if (oldValue && correct.includes(oldValue)) {
      correct = value
        ? correct.map((item) => (item === oldValue ? value : item))
        : correct.filter((item) => item !== oldValue);
    }

    correct = [...new Set(correct.filter(Boolean))];

    next[questionIndex] = {
      ...currentQuestion,
      options,
      correct,
    };

    onChange(next);
  };

  const toggleCorrect = (questionIndex, option) => {
    const next = [...questions];

    const question = next[questionIndex];

    const current = getCorrectAnswers(question);

    const correct = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];

    next[questionIndex] = {
      ...question,
      correct,
    };

    onChange(next);
  };

  return (
    <div className="questionSection">
      <h2>{title}</h2>

      {questions.map((question, index) => {
        const correctAnswers = getCorrectAnswers(question);

        return (
          <div className="questionEditor" key={question.id}>
            <div className="questionNumber">DOMANDA {index + 1}</div>

            <textarea
              placeholder="Scrivi la domanda..."
              value={question.text || ""}
              onChange={(e) => updateQuestion(index, "text", e.target.value)}
            />

            <div className="optionGrid">
              {Array.from({ length: 4 }, (_, optionIndex) => (
                <input
                  key={optionIndex}
                  placeholder={`Risposta ${String.fromCharCode(
                    65 + optionIndex
                  )}`}
                  value={question.options?.[optionIndex] || ""}
                  onChange={(e) =>
                    updateOption(index, optionIndex, e.target.value)
                  }
                />
              ))}
            </div>

            <div className="correctAnswersEditor">
              <div className="correctAnswersTitle">RISPOSTE CORRETTE</div>

              <p>Puoi selezionare anche più alternative.</p>

              <div className="correctCheckboxes">
                {question.options?.filter(Boolean).map((option, optionIndex) => {
                  const checked = correctAnswers.includes(option);

                  return (
                    <label
                      className={
                        checked ? "correctCheckbox checked" : "correctCheckbox"
                      }
                      key={`${question.id}-${optionIndex}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCorrect(index, option)}
                      />

                      <span>
                        {String.fromCharCode(65 + optionIndex)} — {option}
                      </span>
                    </label>
                  );
                })}
              </div>

              {!question.options?.some(Boolean) && (
                <div className="noCorrectAnswer">
                  Inserisci prima le alternative.
                </div>
              )}

              {correctAnswers.length > 0 && (
                <div className="selectedCorrectInfo">
                  Corrette: {correctAnswers.join(" / ")}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
