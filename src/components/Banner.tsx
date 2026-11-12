import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { cx } from './cx';
import s from './Banner.module.css';

export function Banner({ title, children, icon = 'alert', spacing }: { title: string; children: ReactNode; icon?: IconName; spacing?: 'sheet' | 'pay' }) {
  return (
    <div className={cx(s.banner, spacing === 'sheet' && s.inSheet, spacing === 'pay' && s.inPay)}>
      <Icon name={icon} size={20} />
      <div><b>{title}</b>{children}</div>
    </div>
  );
}
