import type { HTMLAttributes } from 'react';
import { cx } from './cx';
import s from './Card.module.css';

interface Props extends HTMLAttributes<HTMLDivElement> { variant?: 'plain' | 'list' | 'rows' | 'ledger' | 'hero' }

export function Card({ variant = 'plain', className, ...rest }: Props) {
  return <div className={cx(s.card, variant === 'list' && s.list, variant === 'rows' && s.rows, variant === 'ledger' && s.ledger, variant === 'hero' && s.hero, className)} {...rest} />;
}
