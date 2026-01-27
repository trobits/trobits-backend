import { DAILY_RESET_HOUR_UTC } from "./dailyRewards.constants";

const pad2 = (n: number) => String(n).padStart(2, "0");

export const toYMD = (d: Date) => {
  const y = d.getUTCFullYear();
  const m = pad2(d.getUTCMonth() + 1);
  const day = pad2(d.getUTCDate());
  return `${y}-${m}-${day}`;
};

/**
 * Cycle key is tied to a day-window starting at 20:00 UTC.
 * If now < 20:00 UTC => we are still in the cycle that started yesterday 20:00 UTC.
 */
export const getCycleKey = (now = new Date()) => {
  const hour = now.getUTCHours();
  const base = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  if (hour < DAILY_RESET_HOUR_UTC) {
    base.setUTCDate(base.getUTCDate() - 1);
  }
  return toYMD(base);
};

export const getNextResetAtUtc = (now = new Date()) => {
  const todayReset = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      DAILY_RESET_HOUR_UTC,
      0,
      0,
      0
    )
  );

  if (now < todayReset) return todayReset;

  const next = new Date(todayReset);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
};

export const getPrevCycleKey = (cycleKey: string) => {
  const [y, m, d] = cycleKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return toYMD(dt);
};
