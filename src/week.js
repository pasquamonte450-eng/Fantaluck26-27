import { makeQuestions, normalizeQuestion } from "./questions";

export const newWeek = (number) => ({
  id: `week-${number}-${Date.now()}`,
  number,
  status: "draft",
  starts_at: "",
  deadline: "",
  matchQuestions: makeQuestions("match"),
  playerQuestions: makeQuestions("player"),
  rigoriCells: 12,
  multiplierBase: 1,
  multiplierStep: 0.15,
  results_published: false,
});

export function normalizeWeek(week) {
  return {
    ...week,
    matchQuestions: Array.from({ length: 10 }, (_, i) =>
      normalizeQuestion(week?.matchQuestions?.[i], "match", i)
    ),
    playerQuestions: Array.from({ length: 10 }, (_, i) =>
      normalizeQuestion(week?.playerQuestions?.[i], "player", i)
    ),
  };
}

export function toDateTimeLocalValue(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export function getWeekState(week) {
  if (!week) return "none";

  const now = Date.now();

  const start = week.starts_at ? new Date(week.starts_at).getTime() : null;
  const end = week.deadline ? new Date(week.deadline).getTime() : null;

  if (week.status === "closed") return "closed";
  if (week.status === "published") return "published";
  if (start && now < start) return "waiting";
  if (end && now > end) return "closed";
  if (week.status === "open") return "open";

  return "draft";
}
