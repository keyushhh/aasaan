import { vi } from 'vitest';

/** Fresh data layer per test: module state and storage both start from the sample data, with no latency. */
export async function freshData() {
  vi.resetModules();
  localStorage.clear();
  const mock = await import('./data/mock');
  Object.assign(mock.LATENCY, { read: 0, ping: 0, pay: 0, write: 0 });
  const data = await import('./data');
  const dept = await import('./data/department');
  return { ...data, outbox: dept.outbox };
}
