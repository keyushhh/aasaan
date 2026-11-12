import { useSyncExternalStore } from 'react';
import { createStore } from '../lib/storage';
import { dictionaries, type Lang } from '../i18n/strings';

export interface Session { loggedIn: boolean; lang: Lang; mobile: string; name: string }

export const sessionStore = createStore<Session>('aasaan-session-v1', () => ({ loggedIn: false, lang: 'en', mobile: '', name: 'Ananya Rao' }));

export const useSession = () => useSyncExternalStore(sessionStore.subscribe, sessionStore.get);
export const setSession = (p: Partial<Session>) => sessionStore.set((s) => ({ ...s, ...p }));

/** The typed dictionary for the current language. */
export const useT = () => dictionaries[useSession().lang];
