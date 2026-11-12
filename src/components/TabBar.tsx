import { Icon, type IconName } from './Icon';
import { cx } from './cx';
import s from './TabBar.module.css';

export type Tab = 'home' | 'services' | 'requests' | 'profile';
const TABS: [Tab, IconName][] = [['home', 'home'], ['services', 'grid'], ['requests', 'list'], ['profile', 'user']];

export function TabBar({ active, labels, badge, onSelect, label }: { active: Tab; labels: Record<Tab, string>; badge: number; onSelect: (t: Tab) => void; label: string }) {
  return (
    <nav className={s.tabs} aria-label={label}>
      <div className={s.inner}>
        {TABS.map(([k, icon]) => (
          <button key={k} type="button" className={cx(s.tab, active === k && s.on)} aria-current={active === k ? 'page' : undefined} onClick={() => onSelect(k)}>
            <Icon name={icon} size={22} />
            <span>{labels[k]}</span>
            {k === 'requests' && badge > 0 && <span className={s.badge}>{badge}</span>}
          </button>
        ))}
      </div>
    </nav>
  );
}
