import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';
import { cx } from './cx';
import s from './IconButton.module.css';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { icon: IconName; label: string; size?: number; spin?: boolean; onSign?: boolean }

export function IconButton({ icon, label, size = 20, spin, onSign, className, ...rest }: Props) {
  return (
    <button type="button" aria-label={label} className={cx(s.iconBtn, onSign && s.onSign, spin && s.spin, className)} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  );
}
