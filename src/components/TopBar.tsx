import type { ReactNode } from 'react';
import type { Dept } from '../data/types';
import s from './TopBar.module.css';

/** With `start`, a detail header (back, centred title, action). Without it, a large tab title. */
export function TopBar({ title, dept, svc, start, end }: { title: string; dept?: string; svc?: Dept; start?: ReactNode; end?: ReactNode }) {
  if (!start) return <header className={`${s.top} ${s.large}`}><h1>{title}</h1>{end}</header>;
  return (
    <header className={s.top} data-svc={svc}>
      {start}
      <h1 className={s.title}>{title}{dept && <span className={s.dept}>{dept}</span>}</h1>
      {end ?? <span className={s.slot} />}
    </header>
  );
}
