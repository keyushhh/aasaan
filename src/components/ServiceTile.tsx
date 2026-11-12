import type { Dept } from '../data/types';
import { Icon, type IconName } from './Icon';
import s from './ServiceTile.module.css';

export function ServiceTile({ svc, icon, name, state, onClick }: { svc: Dept; icon: IconName; name: string; state: string; onClick: () => void }) {
  return (
    <button type="button" className={s.tile} data-svc={svc} onClick={onClick}>
      <Icon name={icon} size={30} />
      <span className={s.name}>{name}</span>
      <span className={s.state}>{state}</span>
    </button>
  );
}
