import { Icon, type IconName } from './Icon';
import { cx } from './cx';
import s from './AlertCard.module.css';

export interface AlertCardProps { tone: 'danger' | 'warn' | 'info'; icon: IconName; title: string; body: string; cta: string; onClick: () => void }

/**
 * One item in the home queue, numbered by priority. Anything with a deadline or a fine (danger, warn) sits in an
 * amber block with a bar down its left edge; the rest are plain rows. The whole item is the button.
 */
export function AlertCard({ tone, title, body, cta, onClick, n }: AlertCardProps & { n: number }) {
  return (
    <button type="button" className={cx(s.item, tone !== 'info' && s.flag)} onClick={onClick}>
      <span className={s.n} aria-hidden="true">{String(n).padStart(2, '0')}</span>
      <span className={s.title}>{title}</span>
      <span className={s.text}>{body}</span>
      <span className={s.go}>{cta}<Icon name="chev" size={16} /></span>
    </button>
  );
}
