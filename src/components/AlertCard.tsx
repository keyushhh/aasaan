import { Icon, type IconName } from './Icon';
import { cx } from './cx';
import s from './AlertCard.module.css';

export interface AlertCardProps { tone: 'danger' | 'warn' | 'info'; icon: IconName; title: string; body: string; cta: string; onClick: () => void }

/** A home attention item. Only the first on screen gets the filled call to action. */
export function AlertCard({ tone, icon, title, body, cta, onClick, first }: AlertCardProps & { first: boolean }) {
  return (
    <button type="button" className={cx(s.alert, tone !== 'info' && s[tone], !first && s.quiet)} onClick={onClick}>
      <span className={s.ic}><Icon name={icon} size={22} /></span>
      <span className={s.body}>
        <span className={s.title}>{title}</span>
        <span className={s.text}>{body}</span>
        <span className={s.go}>{cta}<Icon name="chev" size={16} /></span>
      </span>
    </button>
  );
}
