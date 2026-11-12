import { cx } from './cx';
import s from './Switch.module.css';

export function Switch({ checked, onChange, label, warn }: { checked: boolean; onChange: () => void; label: string; warn?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={cx(s.switch, warn && s.warn)} onClick={onChange} />;
}
