import type { Dept } from '../data/types';
import { Icon, type IconName } from './Icon';
import s from './ServiceTile.module.css';

export function ServiceTile({ svc, icon, name, state, down, onClick }: { svc: Dept; icon: IconName; name: string; state: string; down?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={s.tile} data-svc={svc} onClick={onClick}>
      <span className={s.mark}><Icon name={icon} size={20} /></span>
      <span className={s.body}>
        <span className={s.name}>{name}</span>
        <span className={down ? `${s.state} ${s.down}` : s.state}>{state}</span>
      </span>
      <span className={s.chev}><Icon name="chev" size={18} /></span>
    </button>
  );
}
