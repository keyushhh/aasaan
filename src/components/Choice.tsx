import type { ReactNode } from 'react';
import s from './Choice.module.css';

interface Props {
  type: 'radio' | 'checkbox';
  name?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  /** a leading marker, usually <RowIcon> */
  icon?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  lang?: string;
}

/** One choice in a list: the whole tile is the label, the real input is hidden and a drawn ring or box shows its state. */
export function Choice({ type, name, checked, disabled, onChange, icon, title, sub, lang }: Props) {
  return (
    <label className={s.tile} data-off={disabled || undefined}>
      <input type={type} name={name} checked={checked} disabled={disabled} onChange={onChange} />
      {icon}
      <span className={s.body}>
        <span className="row-t" lang={lang}>{title}</span>
        {sub && <span className="row-s">{sub}</span>}
      </span>
      <span className={type === 'radio' ? s.radio : s.check} aria-hidden="true" />
    </label>
  );
}
