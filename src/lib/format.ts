export const DAY = 86400000;
export const MIN = 60000;

export const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export const fd = (d: string | number) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
export const fts = (ts: number) =>
  new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const todayISO = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
export const daysTo = (d: string) =>
  Math.round((new Date(d + 'T00:00:00').getTime() - new Date(todayISO() + 'T00:00:00').getTime()) / DAY);
export const ago = (ts: number) => {
  const m = Math.round((Date.now() - ts) / MIN);
  if (m < 1) return 'just now';
  if (m < 60) return m + ' min ago';
  const h = Math.round(m / 60);
  if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
  const d = Math.round(h / 24);
  return d + (d === 1 ? ' day ago' : ' days ago');
};
export const rnd = (n: number, chars = '0123456789') =>
  Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
