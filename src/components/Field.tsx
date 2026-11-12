import type { ReactNode } from 'react';
import s from './Field.module.css';

/** A label wrapping one input or select. Show errors with an `.err` region right after it. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className={s.field}>{label}{children}</label>;
}
