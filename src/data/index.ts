import { todayISO } from '../lib/format';
import * as dept from './department';
import { mockAdapters } from './mock';
import type { Adapters } from './services';
import type { ClaimInput, Dept, Request } from './types';

/** The single place that picks which adapters the app talks to. Add `real` adapters here when the APIs are ready. */
const SOURCE = import.meta.env.VITE_DATA_SOURCE ?? 'mock';
const SOURCES: Record<string, Adapters> = { mock: mockAdapters };
export const adapters: Adapters = SOURCES[SOURCE] ?? mockAdapters;
dept.configure({ live: SOURCE !== 'mock' });

const { read, call } = dept;
const a = adapters;

/* Queued claims are sent from the outbox when EPFO comes back. */
dept.registerHandler<ClaimInput>('epf.submitClaim', (input, item) =>
  a.epf.submitClaim(input, { on: item.preview.created, at: item.preview.at }),
);

const queuedClaim = (input: ClaimInput): Request => {
  const d = todayISO();
  return {
    id: 'r' + Date.now(), svc: 'epf', title: `PF withdrawal for ${input.reason.toLowerCase()}`,
    ref: 'Reference number arrives once submitted', amount: input.amount, created: d, at: Date.now(), status: 'queued',
    steps: [
      { label: 'Saved on your phone', date: d, state: 'done' },
      { label: 'Submitted to EPFO', date: '', state: 'current', note: 'Sends automatically when EPFO is back' },
      { label: 'Verified by employer', date: '', state: 'todo' },
      { label: 'EPFO review', date: '', state: 'todo' },
      { label: 'Paid to HDFC Bank ••4417', date: '', state: 'todo' },
    ],
  };
};

/** Everything the UI may ask of a department. Reads fall back to the last synced copy; writes need the department or go to the outbox. */
export const api = {
  epf: {
    summary: () => read('epf', 'summary', a.epf.getSummary),
    passbook: () => read('epf', 'passbook', a.epf.getPassbook),
    submitClaim: async (input: ClaimInput) => {
      const out = await dept.submit('epf', 'epf.submitClaim', input, () => a.epf.submitClaim(input), () => queuedClaim(input));
      return out.queued ? { queued: true, request: out.request } : { queued: false, request: out.result };
    },
  },
  docs: {
    list: () => read('docs', 'list', a.docs.listDocuments),
    shares: () => read('docs', 'shares', a.docs.listShares),
    createShare: (docId: string, hours: number) => call('docs', () => a.docs.createShare(docId, hours)),
    revokeShare: (id: string) => call('docs', () => a.docs.revokeShare(id)),
  },
  vehicle: {
    registration: () => read('vehicle', 'registration', a.vehicle.getRegistration),
    licence: () => read('vehicle', 'licence', a.vehicle.getLicence),
    challans: () => read('vehicle', 'challans', a.vehicle.listChallans),
    pay: (id: string, method: Parameters<Adapters['vehicle']['payChallan']>[1]) => call('vehicle', () => a.vehicle.payChallan(id, method)),
  },
  tax: {
    link: () => read('tax', 'link', a.tax.getPanAadhaarLink),
    ret: () => read('tax', 'return', a.tax.getReturn),
    demands: () => read('tax', 'demands', a.tax.getDemands),
  },
  health: {
    abha: () => read('health', 'abha', a.health.getAbha),
    consents: () => read('health', 'consents', a.health.listConsentRequests),
    respond: (id: string, decision: 'allowed' | 'denied') => call('health', () => a.health.respondToConsent(id, decision)),
    records: () => read('health', 'records', a.health.listRecords),
  },
  /** Aasaan's tracker: what's waiting on the phone, then what departments know about. */
  requests: async (): Promise<Request[]> => {
    const sent = await a.requests.list();
    return [...dept.outbox().map((i) => i.preview), ...sent].sort((x, y) => y.at - x.at);
  },
  refresh: async (d: Dept) => {
    await call(d, () => a.ping(d));
    dept.markSynced(d);
  },
  reset: async () => {
    a.reset?.();
    dept.resetDepartments();
    await warm();
  },
  auth: a.auth,
};

/** Take a first copy of everything, so a department that goes down before its screen is opened still has data to show. */
function warm() {
  const reads = [api.epf.summary, api.epf.passbook, api.docs.list, api.docs.shares, api.vehicle.registration, api.vehicle.licence,
    api.vehicle.challans, api.tax.link, api.tax.ret, api.tax.demands, api.health.abha, api.health.consents, api.health.records];
  return Promise.all(reads.map((r) => r().catch(() => {})));
}
if (!dept.peek('epf', 'summary')) void warm();

export { DepartmentUnavailable, deptStore, onRecovered, setDown, setLinked, setLinks, peek } from './department';
export type * from './types';
