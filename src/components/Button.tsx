import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';
import s from './Button.module.css';
import { cx } from './cx';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary is the one filled button a view may have */
  variant?: 'primary' | 'secondary';
  danger?: boolean;
  small?: boolean;
  block?: boolean;
  /** on a sign-blue hero card */
  onSign?: boolean;
  icon?: IconName;
}

export function Button({ variant = 'secondary', danger, small, block, onSign, icon, className, children, type = 'button', ...rest }: Props) {
  return (
    <button type={type} className={cx(s.btn, variant === 'primary' && s.primary, danger && s.danger, small && s.small, block && s.block, onSign && s.onSign, className)} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}
