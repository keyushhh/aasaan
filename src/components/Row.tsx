import type { ReactNode } from 'react';
import type { Dept } from '../data/types';
import { Icon, type IconName } from './Icon';
import { cx } from './cx';
import s from './Row.module.css';

interface Props {
  title?: ReactNode;
  sub?: ReactNode;
  /** leading slot, usually <RowIcon> */
  icon?: ReactNode;
  /** trailing value, pill or button */
  right?: ReactNode;
  /** bold right-aligned figure */
  figure?: ReactNode;
  chevron?: boolean;
  /** for a row that is one choice of several: marks the chosen one for assistive tech */
  pressed?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

/** A list row. Pass onClick to make the whole row a button. */
export function Row({ title, sub, icon, right, figure, chevron, pressed, onClick, children }: Props) {
  const inner = (
    <>
      {icon}
      {(title || sub) && (
        <span className={s.body}>
          {title && <span className="row-t">{title}</span>}
          {sub && <span className="row-s">{sub}</span>}
        </span>
      )}
      {children}
      {figure != null && <span className={s.right}>{figure}</span>}
      {right}
      {chevron && <span className={s.chev}><Icon name="chev" size={18} /></span>}
    </>
  );
  return onClick ? (
    <button type="button" data-row className={s.row} aria-pressed={pressed} onClick={onClick}>{inner}</button>
  ) : (
    <div data-row className={s.row}>{inner}</div>
  );
}

/** The square icon used at the start of rows and cards. With svc it takes that department's signage colour. */
export function RowIcon({ icon, svc, size = 18, ok, className, style }: { icon: IconName; svc?: Dept; size?: number; ok?: boolean; className?: string; style?: React.CSSProperties }) {
  return <span className={cx(s.ic, ok && s.ok, className)} data-svc={svc} style={style}><Icon name={icon} size={size} /></span>;
}
