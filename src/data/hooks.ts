import { useEffect, useState, useSyncExternalStore } from 'react';
import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { api, deptStore, peek, setDown, setLinked } from './index';
import type { ClaimInput, ConsentRequest, Challan, Dept, PayMethod, Request, Share } from './types';

/** Department reads. Start from the last synced copy so the screen never paints empty, then fetch. */
function useDeptQuery<T>(d: Dept, key: string, fn: () => Promise<T>, enabled = true) {
  return useQuery({ queryKey: [d, key], queryFn: fn, enabled, initialData: () => peek<T>(d, key), initialDataUpdatedAt: 0 });
}

export const useEpfSummary = (on = true) => useDeptQuery('epf', 'summary', api.epf.summary, on);
export const usePassbook = (on = true) => useDeptQuery('epf', 'passbook', api.epf.passbook, on);
export const useDocuments = (on = true) => useDeptQuery('docs', 'list', api.docs.list, on);
export const useShares = (on = true) => useDeptQuery('docs', 'shares', api.docs.shares, on);
export const useRegistration = (on = true) => useDeptQuery('vehicle', 'registration', api.vehicle.registration, on);
export const useLicence = (on = true) => useDeptQuery('vehicle', 'licence', api.vehicle.licence, on);
export const useChallans = (on = true) => useDeptQuery('vehicle', 'challans', api.vehicle.challans, on);
export const usePanLink = (on = true) => useDeptQuery('tax', 'link', api.tax.link, on);
export const useTaxReturn = (on = true) => useDeptQuery('tax', 'return', api.tax.ret, on);
export const useTaxDemands = (on = true) => useDeptQuery('tax', 'demands', api.tax.demands, on);
export const useAbha = (on = true) => useDeptQuery('health', 'abha', api.health.abha, on);
export const useConsents = (on = true) => useDeptQuery('health', 'consents', api.health.consents, on);
export const useRecords = (on = true) => useDeptQuery('health', 'records', api.health.records, on);
export const useRequests = () => useQuery({ queryKey: ['requests'], queryFn: api.requests });

/** Linked, down and last-synced state for every department. */
export const useDepartments = () => useSyncExternalStore(deptStore.subscribe, deptStore.get);

/**
 * A department screen fetches fresh data each time it is opened and shows a skeleton until it arrives,
 * even when an older copy is cached. Later refetches (after a refresh or a change) keep the content on screen.
 */
export function useOpening(queries: UseQueryResult[]) {
  const fetching = queries.some((q) => q.isFetching || q.isPending);
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    if (!fetching) setOpened(true);
  }, [fetching]);
  return !opened || queries.some((q) => q.isPending);
}

export function useActions() {
  const qc = useQueryClient();
  const set = <T>(key: unknown[], f: (old: T) => T) => qc.setQueryData<T>(key, (old) => (old === undefined ? old : f(old)));
  const addRequest = (r: Request) => set<Request[]>(['requests'], (old) => [r, ...old]);
  return {
    submitClaim: async (input: ClaimInput) => {
      const out = await api.epf.submitClaim(input);
      addRequest(out.request);
      return out;
    },
    createShare: async (docId: string, hours: number) => {
      const s = await api.docs.createShare(docId, hours);
      set<Share[]>(['docs', 'shares'], (old) => [s, ...old]);
      return s;
    },
    revokeShare: async (id: string) => {
      await api.docs.revokeShare(id);
      set<Share[]>(['docs', 'shares'], (old) => old.filter((s) => s.id !== id));
    },
    payChallan: async (id: string, method: PayMethod) => {
      const receipt = await api.vehicle.pay(id, method);
      set<Challan[]>(['vehicle', 'challans'], (old) => old.map((c) => (c.id === id ? { ...c, paid: true, paidOn: receipt.paidOn } : c)));
      await qc.refetchQueries({ queryKey: ['requests'] });
      return receipt;
    },
    respondToConsent: async (id: string, decision: 'allowed' | 'denied') => {
      const c = await api.health.respond(id, decision);
      set<ConsentRequest[]>(['health', 'consents'], (old) => old.map((x) => (x.id === id ? c : x)));
      return c;
    },
    refresh: async (d: Dept) => {
      await api.refresh(d);
      qc.invalidateQueries({ queryKey: [d] });
    },
    setLinked: (d: Dept, on: boolean) => {
      setLinked(d, on);
      if (!on) qc.removeQueries({ queryKey: [d] });
    },
    setOutage: (d: Dept, on: boolean) => setDown(d, on),
    reset: async () => {
      await api.reset();
      qc.clear();
    },
  };
}
