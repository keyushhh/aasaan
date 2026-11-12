import type { HTMLAttributes } from 'react';
import { cx } from './cx';
import s from './Card.module.css';

interface Props extends HTMLAttributes<HTMLDivElement> { variant?: 'plain' | 'list' | 'service' | 'hero' }

export function Card({ variant = 'plain', className, children, ...rest }: Props) {
  if (variant === 'hero') {
    return <div className={cx(s.hero, className)} {...rest}><div className={s.heroCore}>{children}</div></div>;
  }
  return <div className={cx(s.card, variant === 'list' && s.list, variant === 'service' && s.svc, className)} {...rest}>{children}</div>;
}
