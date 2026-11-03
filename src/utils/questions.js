export const EMPTY_OPTIONS = ["", "", "", ""];

export const makeQuestion = (type, index) => ({
  id: `${type}-${index + 1}-${Date.now()}`,
  text: "",
  options: [...EMPTY_OPTIONS],
  correct: [],
});

export const makeQuestions = (type) =>
  Array.from({ length: 10 }, (_, i) => makeQuestion(type, i));

export function getCorrectAnswers(question) {
  if (Array.isArray(question?.correct)) {
    return question.correct.filter(Boolean);
  }

  if (question?.correct) {
    return [question.correct];
  }

  return [];
}

export function normalizeQuestion(question, type, index) {
  return {
    ...question,
    id: question?.id || `${type}-${index + 1}-${Date.now()}`,
    text: question?.text || "",
    options: Array.from({ length: 4 }, (_, i) => question?.options?.[i] || ""),
    correct: getCorrectAnswers(question),
  };
}

/** True se la risposta data è tra quelle corrette della domanda. */
export function isAnswerCorrect(question, given) {
  return Boolean(given && getCorrectAnswers(question).includes(given));
}

/** Conta le risposte corrette confrontando domande e risposte per indice. */
export function countCorrect(questions, answers) {
  return questions.reduce(
    (total, question, index) =>
      total + (isAnswerCorrect(question, answers[index]) ? 1 : 0),
    0
  );
}
