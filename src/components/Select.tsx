import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from './Icon';
import s from './Select.module.css';

interface Props<T extends string> { label: string; value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void }

/**
 * A compact dropdown: a pill showing the current choice that opens a small raised menu under it.
 * Arrow keys move through the choices, Escape closes and returns focus, a tap outside closes it.
 */
export function Select<T extends string>({ label, value, options, onChange }: Props<T>) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const current = options.find(([v]) => v === value)?.[1];

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  const close = () => { setOpen(false); btn.current?.focus(); };
  const keys = (e: KeyboardEvent) => {
    const items = [...root.current!.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus(); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div ref={root} className={s.wrap}>
      <button ref={btn} type="button" className={s.btn} aria-haspopup="menu" aria-expanded={open} aria-label={`${label}: ${current}`} onClick={() => setOpen((o) => !o)}>
        {current}<Icon name="down" size={16} />
      </button>
      {open && (
        <div role="menu" aria-label={label} className={s.menu} onKeyDown={keys}>
          {options.map(([v, text]) => (
            <button key={v} type="button" role="menuitemradio" aria-checked={v === value} className={s.item} onClick={() => { onChange(v); close(); }}>
              <span>{text}</span>{v === value && <Icon name="check" size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
