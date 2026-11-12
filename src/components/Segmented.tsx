import { cx } from './cx';
import s from './Segmented.module.css';

interface Option<V> { value: V; label: string; lang?: string }
export function Segmented<V extends string | number>({ options, value, onChange, label }: { options: Option<V>[]; value: V; onChange: (v: V) => void; label: string }) {
  return (
    <div className={s.seg} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" lang={o.lang} aria-pressed={o.value === value} className={cx(o.value === value && s.on)} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
