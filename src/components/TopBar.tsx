import type { ReactNode } from 'react';
import type { Dept } from '../data/types';
import s from './TopBar.module.css';

/** Screen header. With `svc`, the department line carries that department's signage colour. Without `start`, it is a large title. */
export function TopBar({ title, dept, svc, start, end }: { title: string; dept?: string; svc?: Dept; start?: ReactNode; end?: ReactNode }) {
  return (
    <header className={start ? s.top : `${s.top} ${s.large}`} data-svc={svc}>
      {start}
      <h1>{title}{dept && <span className={s.dept}>{dept}</span>}</h1>
      {end}
    </header>
  );
}
