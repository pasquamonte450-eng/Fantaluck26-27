/**
 * Unisce più liste di partecipazioni eliminando i duplicati per id.
 * Se lo stesso id compare più volte vince l'ultima lista.
 */
export function mergeAttempts(...lists) {
  const map = new Map();

  lists.flat().forEach((attempt) => {
    if (attempt?.id) {
      map.set(attempt.id, attempt);
    }
  });

  return Array.from(map.values());
}
