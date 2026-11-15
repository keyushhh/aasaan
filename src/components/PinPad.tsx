import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';
import s from './PinPad.module.css';

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** read out with the count of digits entered, e.g. "App PIN, 2 of 4 digits entered" */
  label: string;
  deleteLabel: string;
  /** shakes the boxes and tints them red */
  error?: boolean;
  /** the key left of 0, such as fingerprint unlock */
  extra?: ReactNode;
  length?: number;
}

/** PIN entry as boxes over a phone-style keypad. A physical keyboard works too: digits and Backspace. */
export function PinPad({ value, onChange, label, deleteLabel, error, extra, length = 4 }: Props) {
  // Keys can arrive faster than React re-renders, so track the entry here as well as in the parent.
  const cur = useRef(value);
  cur.current = value;
  const press = (d: string) => {
    if (cur.current.length >= length) return;
    cur.current += d;
    onChange(cur.current);
  };
  const del = () => {
    cur.current = cur.current.slice(0, -1);
    onChange(cur.current);
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') del();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  return (
    <div className={s.pad}>
      <div className={s.boxes} data-error={error || undefined} role="img" aria-label={label}>
        {Array.from({ length }, (_, i) => <span key={i} data-on={i < value.length || undefined} data-now={i === value.length || undefined} />)}
      </div>
      <div className={s.keys}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => <button key={d} type="button" className={s.key} onClick={() => press(d)}>{d}</button>)}
        <span className={s.slot}>{extra}</span>
        <button type="button" className={s.key} onClick={() => press('0')}>0</button>
        <button type="button" className={`${s.key} ${s.quiet}`} aria-label={deleteLabel} onClick={del}><Icon name="backspace" size={24} /></button>
      </div>
    </div>
  );
}
