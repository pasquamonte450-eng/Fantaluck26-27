import { countCorrect } from "./questions";

export const POINTS_PER_CORRECT = 10;

/**
 * Calcola i punteggi di una partecipazione a partire dalle domande della
 * settimana (match + player, in ordine) e dalle risposte date.
 */
export function computeAttemptScore(attempt, questions) {
  const answers = [
    ...(attempt.match_answers || []),
    ...(attempt.player_answers || []),
  ];

  const correct = countCorrect(questions, answers);

  const baseScore = correct * POINTS_PER_CORRECT;

  const multiplier = Number(attempt.multiplier || 1);

  return {
    base_score: baseScore,
    correct_answers: correct,
    final_score: Math.round(baseScore * multiplier),
  };
}
