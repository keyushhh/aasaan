import { useLocation, useNavigate } from 'react-router';
import type { IconName } from '../components/Icon';
import type { Dept } from '../data/types';
import { useSheet } from '../components/Sheet';

export const SVC_ICON: Record<Dept, IconName> = { epf: 'wallet', docs: 'folder', vehicle: 'car', tax: 'receipt', health: 'heart' };
export type Route = 'home' | 'services' | 'requests' | 'profile' | Dept;

/** How many in-app steps Back can retrace. Tabs reset it; Back with nothing to retrace goes Home. */
let depth = 0;

export function useNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sheet = useSheet();
  const current = pathname.slice(1) || 'home';
  return {
    current,
    go(r: Route) {
      depth++;
      if (current === r) sheet.close();
      else navigate('/' + r);
    },
    tab(r: Route) {
      depth = 0;
      if (current === r) window.scrollTo(0, 0);
      else navigate('/' + r);
    },
    back() {
      if (depth > 0) {
        depth--;
        navigate(-1);
      } else navigate('/home');
    },
    home: () => navigate('/home'),
  };
}
