export const DAILY_RESET_HOUR_UTC = 0; // 12 AM UTC
export const MAX_STREAK_DAY = 7;

/**
 * Configure points per streak day (1..7)
 * Change values as you want.
 */
export const pointsForDay = (day: number) => {
  const table = [10, 10, 20, 20, 30, 30, 30];
  const safeDay = Math.max(1, Math.min(day, MAX_STREAK_DAY));
  return table[safeDay - 1];
};
