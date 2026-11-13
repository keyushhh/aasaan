import { Icon, type IconName } from './Icon';
import { cx } from './cx';
import s from './AlertCard.module.css';

export interface AlertCardProps { tone: 'danger' | 'warn' | 'info'; icon: IconName; title: string; body: string; cta: string; onClick: () => void }

/**
 * One row of the home queue, in a grouped list: tinted icon tile, title, the full reason, chevron.
 * The whole row is the action; its label is spoken but not shown, as in a native list.
 */
export function AlertCard({ tone, icon, title, body, cta, onClick }: AlertCardProps) {
  return (
    <button type="button" className={cx(s.item, tone !== 'info' && s.flag)} onClick={onClick}>
      <span className={s.ic}><Icon name={icon} size={20} /></span>
      <span className={s.body}>
        <span className={s.title}>{title}</span>
        <span className={s.text}>{body}</span>
        <span className={s.sr}>{cta}</span>
      </span>
      <span className={s.chev}><Icon name="chev" size={18} /></span>
    </button>
  );
}
