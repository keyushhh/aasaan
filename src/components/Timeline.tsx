import type { Step } from '../data/types';
import { fd } from '../lib/format';
import { useT } from '../app/session';
import { Icon } from './Icon';
import s from './Timeline.module.css';

export function Timeline({ steps }: { steps: Step[] }) {
  const t = useT();
  return (
    <ol className={s.tl}>
      {steps.map((st, i) => (
        <li key={i} className={s[st.state]}>
          <span className={s.dot}>{st.state === 'done' ? <Icon name="check" size={15} /> : st.state === 'current' ? <Icon name="clock" size={15} /> : null}</span>
          <span className="row-t">{st.label}</span>
          <span className="row-s">{st.date ? fd(st.date) : st.note || (st.state === 'current' ? t.stepInProgress : t.stepNotStarted)}</span>
        </li>
      ))}
    </ol>
  );
}
