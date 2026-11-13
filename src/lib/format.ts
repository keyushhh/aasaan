export const DAY = 86400000;
export const MIN = 60000;

/**
 * Every figure, date and relative time follows the app's language, always with Indian digit grouping and Latin digits,
 * as Indian apps print them. The session sets the language before React renders.
 */
let loc = 'en-IN';
export const setLocale = (lang: string) => void (loc = `${lang}-IN-u-nu-latn`);

export const inr = (n: number) =>
  new Intl.NumberFormat(loc, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export const num = (n: number) => new Intl.NumberFormat(loc).format(n);
export const fd = (d: string | number) =>
  new Date(d).toLocaleDateString(loc, { day: '2-digit', month: 'short', year: 'numeric' });
/** Weekday, day and month, as in Home's greeting. */
export const fday = (d: string | number) => new Date(d).toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short' });
export const fts = (ts: number) =>
  new Date(ts).toLocaleString(loc, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const todayISO = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
export const daysTo = (d: string) =>
  Math.round((new Date(d + 'T00:00:00').getTime() - new Date(todayISO() + 'T00:00:00').getTime()) / DAY);
export const ago = (ts: number) => {
  const rtf = new Intl.RelativeTimeFormat(loc, { numeric: 'auto' });
  const m = Math.round((Date.now() - ts) / MIN);
  if (m < 1) return rtf.format(0, 'second');
  if (m < 60) return rtf.format(-m, 'minute');
  const h = Math.round(m / 60);
  if (h < 24) return rtf.format(-h, 'hour');
  return rtf.format(-Math.round(h / 24), 'day');
};
/** Working days (Monday to Friday) since a date, at least 1: a step that started on Thursday is on working day 1 on Friday. */
export const workingDaysSince = (d: string) => {
  let n = 0;
  const t = new Date(d + 'T00:00:00'), end = new Date(todayISO() + 'T00:00:00');
  for (t.setDate(t.getDate() + 1); t <= end; t.setDate(t.getDate() + 1)) if (t.getDay() % 6) n++;
  return Math.max(n, 1);
};
export const rnd = (n: number, chars = '0123456789') =>
  Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
