const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const IPO_OPEN_MINUTES = 10 * 60;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function getIstParts(now = new Date()) {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);

  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth() + 1,
    day: ist.getUTCDate(),
    hours: ist.getUTCHours(),
    minutes: ist.getUTCMinutes(),
    weekday: ist.getUTCDay(),
  };
}

export function formatIstDate(parts: { year: number; month: number; day: number }) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function istDateTimeToUtc(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  const value = new Date(`${date}T${time}:00+05:30`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function addIstDays(date: string, days: number) {
  const current = istDateTimeToUtc(date, "00:00");

  if (!current) {
    return date;
  }

  const next = new Date(current.getTime() + days * 86_400_000);
  return formatIstDate(getIstParts(next));
}

function isIstWeekend(date: string) {
  const midnight = istDateTimeToUtc(date, "00:00");
  return midnight ? getIstParts(midnight).weekday % 6 === 0 : false;
}

export function nextIpoOpenParts(now = new Date()) {
  const parts = getIstParts(now);
  const minutes = parts.hours * 60 + parts.minutes;
  let date = formatIstDate(parts);

  if (minutes >= IPO_OPEN_MINUTES) {
    date = addIstDays(date, 1);
  }

  while (isIstWeekend(date)) {
    date = addIstDays(date, 1);
  }

  return { date, time: "10:00" };
}

export function nextIpoOpenAt(now = new Date()) {
  const { date, time } = nextIpoOpenParts(now);
  return istDateTimeToUtc(date, time) ?? now;
}
