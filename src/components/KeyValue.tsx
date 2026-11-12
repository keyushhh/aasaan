import { Fragment, type ReactNode } from 'react';
import { cx } from './cx';
import s from './KeyValue.module.css';

export function KeyValue({ items, flush }: { items: [string, ReactNode][]; flush?: boolean }) {
  return (
    <dl className={cx(s.kv, flush && s.flush)}>
      {items.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}
    </dl>
  );
}
