import type { ReactNode } from 'react';
import s from './TopBar.module.css';

export function TopBar({ title, dept, start, end }: { title: string; dept?: string; start?: ReactNode; end?: ReactNode }) {
  return (
    <header className={s.top}>
      {start}
      <h1>{title}{dept && <span className={s.dept}>{dept}</span>}</h1>
      {end}
    </header>
  );
}
