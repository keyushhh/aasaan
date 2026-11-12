import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import s from './Empty.module.css';

export function Empty({ icon, children }: { icon: IconName; children: ReactNode }) {
  return <div className={s.empty}><span className={s.mark}><Icon name={icon} size={20} /></span><span>{children}</span></div>;
}
