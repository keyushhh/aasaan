import { Icon, type IconName } from './Icon';
import { cx } from './cx';
import s from './TabBar.module.css';

export type Tab = 'home' | 'services' | 'requests' | 'profile';
const TABS: [Tab, IconName][] = [['home', 'home'], ['services', 'grid'], ['requests', 'list'], ['profile', 'user']];

interface Props { active: Tab; labels: Record<Tab, string>; badge: number; onSelect: (t: Tab) => void; label: string; searchLabel: string; onSearch: () => void }

/** A floating dock: the four tabs on a raised track, the selected one on a tinted pill, and a round search button beside them. */
export function TabBar({ active, labels, badge, onSelect, label, searchLabel, onSearch }: Props) {
  return (
    <nav className={s.tabs} aria-label={label}>
      <div className={s.dock}>
        <div className={s.track}>
          {TABS.map(([k, icon]) => (
            <button key={k} type="button" className={cx(s.tab, active === k && s.on)} aria-current={active === k ? 'page' : undefined} onClick={() => onSelect(k)}>
              <Icon name={icon} size={22} />
              <span>{labels[k]}</span>
              {k === 'requests' && badge > 0 && <span className={s.badge}>{badge}</span>}
            </button>
          ))}
        </div>
        <button type="button" className={s.fab} aria-label={searchLabel} onClick={onSearch}><Icon name="search" size={24} /></button>
      </div>
    </nav>
  );
}
