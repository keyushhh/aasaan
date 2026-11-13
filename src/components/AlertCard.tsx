import { Icon, type IconName } from './Icon';
import { cx } from './cx';
import s from './AlertCard.module.css';

export interface AlertCardProps { tone: 'danger' | 'warn' | 'info'; icon: IconName; title: string; body: string; cta: string; onClick: () => void }

/** A home attention item: a queue row with the action in a pill under the reason. */
export function AlertCard({ tone, icon, title, body, cta, onClick }: AlertCardProps) {
  return (
    <button type="button" className={cx(s.alert, tone !== 'info' && s[tone])} onClick={onClick}>
      <span className={s.ic}><Icon name={icon} size={18} /></span>
      <span className={s.body}>
        <span className={s.title}>{title}</span>
        <span className={s.text}>{body}</span>
      </span>
      <span className={s.go}>{cta}<Icon name="chev" size={16} /></span>
    </button>
  );
}
