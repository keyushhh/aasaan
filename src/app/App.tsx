import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { SheetProvider } from '../components/Sheet';
import { ToastProvider, useToast } from '../components/Toast';
import { TabBar, type Tab } from '../components/TabBar';
import { onRecovered } from '../data';
import { useRequests } from '../data/hooks';
import { useSession, useT } from './session';
import { useNav } from './nav';
import { Login } from '../features/auth/Login';
import { Home } from '../features/home/Home';
import { Services } from '../features/search/Services';
import { Requests } from '../features/requests/Requests';
import { Profile } from '../features/profile/Profile';
import { Epf } from '../features/epf/Epf';
import { Documents } from '../features/documents/Documents';
import { Vehicle } from '../features/vehicle/Vehicle';
import { Tax } from '../features/tax/Tax';
import { Health } from '../features/health/Health';
import s from './Shell.module.css';

export const makeQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, staleTime: 0 } } });

export function App({ client = makeQueryClient() }: { client?: QueryClient }) {
  return (
    <QueryClientProvider client={client}>
      <HashRouter>
        <ToastProvider>
          <SheetProvider>
            <Root />
          </SheetProvider>
        </ToastProvider>
      </HashRouter>
    </QueryClientProvider>
  );
}

function Root() {
  const { loggedIn, lang } = useSession();
  const t = useT();
  const qc = useQueryClient();
  const toast = useToast();

  useEffect(() => void (document.documentElement.lang = lang), [lang]);
  useEffect(
    () =>
      onRecovered(({ dept, sent }) => {
        qc.invalidateQueries({ queryKey: [dept] });
        qc.invalidateQueries({ queryKey: ['requests'] });
        toast(sent ? t.backWithQueue(t.dept[dept], sent) : t.backOnline(t.dept[dept]));
      }),
    [qc, toast, t],
  );

  if (!loggedIn) return <div className={`${s.shell} ${s.bare}`}><Login /></div>;
  return <Shell />;
}

const TABS: Tab[] = ['home', 'services', 'requests', 'profile'];

function Shell() {
  const t = useT();
  const nav = useNav();
  const { pathname } = useLocation();
  const requests = useRequests();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const active = (TABS as string[]).includes(nav.current) ? (nav.current as Tab) : 'services';
  const open = requests.data?.filter((r) => r.status !== 'done').length ?? 0;
  const skip = () => {
    const m = document.getElementById('main');
    if (m) { m.setAttribute('tabindex', '-1'); m.focus(); }
  };

  return (
    <>
      <button type="button" className={s.skip} onClick={skip}>{t.skip}</button>
      <div className={s.shell}>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/epf" element={<Epf />} />
          <Route path="/docs" element={<Documents />} />
          <Route path="/vehicle" element={<Vehicle />} />
          <Route path="/tax" element={<Tax />} />
          <Route path="/health" element={<Health />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
      <TabBar active={active} labels={t.tabs} badge={open} onSelect={nav.tab} label={t.mainNav} />
    </>
  );
}
