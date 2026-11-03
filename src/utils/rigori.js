/** Caselle "gol" disponibili su 12 per il rigore numero `shotNumber` (0-based). */
export function goalsAvailableForShot(shotNumber) {
  const pair = Math.floor(shotNumber / 2);

  return Math.max(2, 11 - pair);
}
