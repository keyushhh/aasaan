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
  /** kept for callers; secondary surface on any background */
  onSign?: boolean;
  icon?: IconName;
  /** a trailing icon in its own disc, for the main action of a screen */
  trail?: IconName;
}

export function Button({ variant = 'secondary', danger, small, block, onSign, icon, trail, className, children, type = 'button', ...rest }: Props) {
  return (
    <button type={type} className={cx(s.btn, variant === 'primary' && s.primary, danger && s.danger, small && s.small, block && s.block, onSign && s.onSign, trail && s.hasTrail, className)} {...rest}>
      {trail ? <span>{icon && <Icon name={icon} size={18} />}{children}</span> : <>{icon && <Icon name={icon} size={18} />}{children}</>}
      {trail && <span className={s.trail} aria-hidden="true"><Icon name={trail} size={18} /></span>}
    </button>
  );
}
