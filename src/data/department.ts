import { createStore, read as readStore, write as writeStore } from '../lib/storage';
import { MIN } from '../lib/format';
import { DEPTS, type Dept, type Request } from './types';

/** Thrown by any department call when that department can't be reached. */
export class DepartmentUnavailable extends Error {
  constructor(public dept: Dept) {
    super(`${dept} is unavailable`);
    this.name = 'DepartmentUnavailable';
  }
}

type PerDept<T> = Record<Dept, T>;
const per = <T>(f: (d: Dept) => T) => Object.fromEntries(DEPTS.map((d) => [d, f(d)])) as PerDept<T>;

export interface DeptState { linked: PerDept<boolean>; down: PerDept<boolean>; sync: PerDept<number> }

const AGO: PerDept<number> = { epf: 25, docs: 130, vehicle: 9, tax: 26 * 60, health: 42 };
const seed = (): DeptState => {
  const n = Date.now();
  return { linked: per(() => true), down: per(() => false), sync: per((d) => n - AGO[d] * MIN) };
};

export const deptStore = createStore<DeptState>('aasaan-dept-v1', seed);

/**
 * live: real adapters. A successful read marks the department synced, and up/down follows real answers.
 * Mock: sync times stay as seeded (like the reference) and up/down is driven only by the prototype switches.
 */
let live = false;
export const configure = (o: { live: boolean }) => void (live = o.live);

export const isDown = (d: Dept) => deptStore.get().down[d];
export const markSynced = (d: Dept) => deptStore.set((s) => ({ ...s, sync: { ...s.sync, [d]: Date.now() } }));

/* ---------- last-synced copy ---------- */
const CACHE = 'aasaan-cache-v1';
type Cache = Record<string, unknown>;
const cacheKey = (d: Dept, k: string) => `${d}:${k}`;
export const peek = <T>(d: Dept, k: string) => readStore<Cache>(CACHE, {})[cacheKey(d, k)] as T | undefined;
const keep = (d: Dept, k: string, v: unknown) => writeStore(CACHE, { ...readStore<Cache>(CACHE, {}), [cacheKey(d, k)]: v });
const forget = (d: Dept) =>
  writeStore(CACHE, Object.fromEntries(Object.entries(readStore<Cache>(CACHE, {})).filter(([k]) => !k.startsWith(d + ':'))));

async function guard<T>(d: Dept, fn: () => Promise<T>): Promise<T> {
  try {
    const out = await fn();
    if (live && isDown(d)) await setDown(d, false); // the department answered again
    return out;
  } catch (e) {
    if (live && e instanceof DepartmentUnavailable && !isDown(d)) await setDown(d, true);
    throw e;
  }
}

/** Read from a department. If it's down, fall back to the last synced copy. */
export async function read<T>(d: Dept, k: string, fn: () => Promise<T>): Promise<T> {
  try {
    const out = await guard(d, fn);
    keep(d, k, out);
    if (live) markSynced(d);
    return out;
  } catch (e) {
    const cached = peek<T>(d, k);
    if (e instanceof DepartmentUnavailable && cached !== undefined) return cached;
    throw e;
  }
}

/** A write that can't be queued (it needs the department to answer now). */
export const call = <T>(d: Dept, fn: () => Promise<T>) => guard(d, fn);

/* ---------- outbox ---------- */
const OUTBOX = 'aasaan-outbox-v1';
export interface OutboxItem { id: string; dept: Dept; op: string; payload: unknown; preview: Request }
type Handler = (payload: unknown, item: OutboxItem) => Promise<unknown>;
const handlers = new Map<string, Handler>();
export const registerHandler = <P>(op: string, h: (payload: P, item: OutboxItem) => Promise<unknown>) =>
  void handlers.set(op, h as Handler);
export const outbox = () => readStore<OutboxItem[]>(OUTBOX, []);

/** Send now, or keep it on the phone if the department is down. Resolves with what the citizen should see. */
export async function submit<P, R>(d: Dept, op: string, payload: P, send: () => Promise<R>, preview: () => Request) {
  const enqueue = () => {
    const p = preview();
    writeStore(OUTBOX, [...outbox(), { id: p.id, dept: d, op, payload, preview: p }]);
    return { queued: true as const, request: p };
  };
  if (isDown(d)) return enqueue();
  try {
    return { queued: false as const, result: await guard(d, send) };
  } catch (e) {
    if (e instanceof DepartmentUnavailable) return enqueue();
    throw e;
  }
}

async function flush(d: Dept) {
  let sent = 0;
  for (const item of outbox().filter((i) => i.dept === d)) {
    const h = handlers.get(item.op);
    if (!h) continue;
    try {
      await h(item.payload, item);
      writeStore(OUTBOX, outbox().filter((i) => i.id !== item.id));
      sent++;
    } catch {
      break; // still unreachable; try again on the next recovery
    }
  }
  return sent;
}

/* ---------- health and recovery ---------- */
type Recovered = (e: { dept: Dept; sent: number }) => void;
const listeners = new Set<Recovered>();
export const onRecovered = (f: Recovered) => (listeners.add(f), () => void listeners.delete(f));

/** Marks a department up or down. Coming back up sends everything queued for it. */
export async function setDown(d: Dept, down: boolean) {
  deptStore.set((s) => ({ ...s, down: { ...s.down, [d]: down } }));
  if (down) return 0;
  const sent = await flush(d);
  markSynced(d);
  listeners.forEach((f) => f({ dept: d, sent }));
  return sent;
}

export function setLinked(d: Dept, on: boolean) {
  deptStore.set((s) => ({
    ...s,
    linked: { ...s.linked, [d]: on },
    sync: on ? { ...s.sync, [d]: Date.now() } : s.sync,
  }));
  if (!on) forget(d); // unlinking deletes Aasaan's copy
}

export const setLinks = (links: PerDept<boolean>) => deptStore.set((s) => ({ ...s, linked: links }));

export function resetDepartments() {
  deptStore.set(seed());
  writeStore(CACHE, {});
  writeStore(OUTBOX, []);
}
