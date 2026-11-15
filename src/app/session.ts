import { useSyncExternalStore } from 'react';
import { createStore } from '../lib/storage';
import { dictionaries, en, type Lang } from '../i18n/strings';
import { setLocale } from '../lib/format';
import { api } from '../data';
import type { Dept } from '../data/types';

export type Theme = 'system' | 'light' | 'dark';
export interface Session { loggedIn: boolean; lang: Lang; mobile: string; name: string; theme?: Theme; reminders?: string[]; email?: string; photo?: string; pin?: string; bio?: string; notified?: string[];
  /** fixed at sign-up: whose records these are, even if the mobile number changes later */
  account?: string;
  /** departments that had records for this person at sign-up */
  found?: Dept[];
  /** the first-run checklist on Home was dismissed */
  setupHidden?: boolean;
}

export const sessionStore = createStore<Session>('aasaan-session-v1', () => ({ loggedIn: false, lang: 'en', mobile: '', name: 'Ananya Rao', theme: 'system' }));

export const useSession = () => useSyncExternalStore(sessionStore.subscribe, sessionStore.get);
export const setSession = (p: Partial<Session>) => sessionStore.set((s) => ({ ...s, ...p }));

/** The typed dictionary for the current language. */
export const useT = () => dictionaries[useSession().lang] ?? en;

/** Dates and figures follow the language. A language no longer offered falls back to English. */
const applyLocale = () => setLocale(dictionaries[sessionStore.get().lang] ? sessionStore.get().lang : 'en');
applyLocale();
sessionStore.subscribe(applyLocale);

/**
 * Light, dark, or follow the device. The app always resolves the choice itself and sets data-theme on <html>,
 * so the tokens hold a single dark palette. System follows the device and keeps following it if it changes.
 * Applied at import, before React renders, so the first paint is already right.
 */
const darkQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : undefined;
function applyTheme() {
  const theme = sessionStore.get().theme ?? 'system';
  document.documentElement.dataset.theme = theme === 'system' ? (darkQuery?.matches ? 'dark' : 'light') : theme;
}
applyTheme();
sessionStore.subscribe(applyTheme);
darkQuery?.addEventListener('change', applyTheme);

/** Serve the signed-in account's records. Sessions from before accounts existed use their mobile number. */
const applyAccount = () => {
  const s = sessionStore.get();
  if (s.loggedIn) void api.setAccount(s.account ?? s.mobile);
};
applyAccount();
sessionStore.subscribe(applyAccount);
