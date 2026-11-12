import { createStore } from '../../lib/storage';
import { rnd, sleep, todayISO } from '../../lib/format';
import { DepartmentUnavailable, isDown } from '../department';
import { InvalidOtp, type Adapters } from '../services';
import type { Dept, Request } from '../types';
import * as S from './seed';

/** Latency mirrors the reference prototype so screens feel the same. */
export const LATENCY = { read: 420, ping: 700, pay: 1300, write: 0 };

const store = createStore('aasaan-mock-v1', S.seedState);
const mutate = (f: (s: S.MockState) => S.MockState) => store.set(f);

async function answer<T>(d: Dept, ms: number, fn: () => T): Promise<T> {
  if (ms) await sleep(ms);
  if (isDown(d)) throw new DepartmentUnavailable(d);
  return fn();
}
const addRequest = (r: Request) => mutate((s) => ({ ...s, requests: [r, ...s.requests] }));

export const mockAdapters: Adapters = {
  ping: (d) => answer(d, LATENCY.ping, () => undefined),
  reset: () => store.set(S.seedState()),

  epf: {
    getSummary: () => answer('epf', LATENCY.read, () => S.EPF),
    getPassbook: () => answer('epf', LATENCY.read, () => S.PASSBOOK),
    submitClaim: (input, queued) =>
      answer('epf', LATENCY.write, () => {
        const d = todayISO();
        const r: Request = {
          id: 'r' + Date.now(), svc: 'epf', title: `PF withdrawal for ${input.reason.toLowerCase()}`,
          ref: 'EPF/KA/26/' + rnd(6), amount: input.amount, created: queued?.on ?? d, at: queued?.at ?? Date.now(), status: 'active',
          steps: [
            ...(queued ? [{ label: 'Saved on your phone', date: queued.on, state: 'done' as const }] : []),
            { label: 'Submitted to EPFO', date: d, state: 'done' },
            { label: 'Verified by employer', date: '', state: 'current', note: 'Usually 2 to 3 working days' },
            { label: 'EPFO review', date: '', state: 'todo' },
            { label: 'Paid to HDFC Bank ••4417', date: '', state: 'todo' },
          ],
        };
        addRequest(r);
        return r;
      }),
  },

  docs: {
    listDocuments: () => answer('docs', LATENCY.read, () => S.DOCS),
    listShares: () => answer('docs', LATENCY.read, () => store.get().shares.filter((s) => s.exp > Date.now())),
    createShare: (doc, hours) =>
      answer('docs', LATENCY.write, () => {
        const share = { id: 's' + Date.now(), doc, code: rnd(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'), exp: Date.now() + hours * 3600000 };
        mutate((s) => ({ ...s, shares: [share, ...s.shares] }));
        return share;
      }),
    revokeShare: (id) => answer('docs', LATENCY.write, () => mutate((s) => ({ ...s, shares: s.shares.filter((x) => x.id !== id) }))),
  },

  vehicle: {
    getRegistration: () => answer('vehicle', LATENCY.read, () => S.REGISTRATION),
    getLicence: () => answer('vehicle', LATENCY.read, () => S.LICENCE),
    listChallans: () => answer('vehicle', LATENCY.read, () => store.get().challans),
    payChallan: (id) =>
      answer('vehicle', LATENCY.pay, () => {
        const c = store.get().challans.find((x) => x.id === id);
        if (!c || c.paid) throw new Error('Challan not payable');
        const d = todayISO(), utr = rnd(12);
        mutate((s) => ({ ...s, challans: s.challans.map((x) => (x.id === id ? { ...x, paid: true, paidOn: d } : x)) }));
        addRequest({
          id: 'r' + Date.now(), svc: 'vehicle', title: `Challan paid for ${c.offence.toLowerCase()}`, ref: 'UTR ' + utr,
          amount: c.amount, created: d, at: Date.now(), status: 'done',
          steps: [{ label: 'Payment received', date: d, state: 'done' }, { label: 'Challan closed', date: d, state: 'done' }],
        });
        return { utr, paidOn: d, amount: c.amount, challanNo: c.no };
      }),
  },

  tax: {
    getPanAadhaarLink: () => answer('tax', LATENCY.read, () => S.PAN_LINK),
    getReturn: () => answer('tax', LATENCY.read, () => S.TAX_RETURN),
    getDemands: () => answer('tax', LATENCY.read, () => []),
  },

  health: {
    getAbha: () => answer('health', LATENCY.read, () => S.ABHA),
    listConsentRequests: () => answer('health', LATENCY.read, () => store.get().consents),
    respondToConsent: (id, decision) =>
      answer('health', LATENCY.write, () => {
        mutate((s) => ({ ...s, consents: s.consents.map((c) => (c.id === id ? { ...c, status: decision } : c)) }));
        return store.get().consents.find((c) => c.id === id)!;
      }),
    listRecords: () => answer('health', LATENCY.read, () => S.RECORDS),
  },

  requests: { list: async () => store.get().requests },

  auth: {
    sendOtp: async () => {},
    verifyOtp: async (_mobile, otp) => {
      if (otp.trim() !== '123456') throw new InvalidOtp();
      return S.CITIZEN;
    },
  },
};
