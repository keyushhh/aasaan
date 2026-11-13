import { useSyncExternalStore } from 'react';
import { createStore } from '../lib/storage';
import { dictionaries, en, type Lang } from '../i18n/strings';
import { setLocale } from '../lib/format';

export type Theme = 'system' | 'light' | 'dark';
export interface Session { loggedIn: boolean; lang: Lang; mobile: string; name: string; theme?: Theme; reminders?: string[] }

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
 * Light, dark, or follow the device. The tokens read data-theme on <html>; with no attribute they follow
 * prefers-color-scheme. Applied at import, before React renders, so the first paint is already right.
 */
function applyTheme() {
  const theme = sessionStore.get().theme ?? 'system';
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.dataset.theme = theme;
}
applyTheme();
sessionStore.subscribe(applyTheme);
