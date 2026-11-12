import type { ReactNode } from 'react';
import { cx } from './cx';
import s from './Pill.module.css';

export type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info';
export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cx(s.pill, tone !== 'neutral' && s[tone])}>{children}</span>;
}
