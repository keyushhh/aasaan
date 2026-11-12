import { useState } from 'react';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Row, RowIcon } from '../../components/Row';
import { TopBar } from '../../components/TopBar';
import { DEPTS } from '../../data/types';
import { useDepartments } from '../../data/hooks';
import { SVC_ICON, useNav } from '../../app/nav';
import { useT } from '../../app/session';
import { searchActions } from './search';
import s from './Services.module.css';

export function Services() {
  const t = useT();
  const nav = useNav();
  const { linked } = useDepartments();
  const [q, setQ] = useState('');
  const hits = searchActions(q, t.actions);
  return (
    <>
      <TopBar title={t.tabs.services} />
      <main className="pad" id="main">
        <label className={s.search}>
          <Icon name="search" size={20} />
          <input type="search" placeholder={t.search} autoComplete="off" aria-label={t.searchLabel} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        {hits && (
          <Card variant="list" className={s.results}>
            {hits.length ? (
              hits.map(([label, route]) => (
                <Row key={label} title={label} sub={route === 'requests' ? t.requestsLabel : t.dept[route]} chevron onClick={() => nav.go(route)} />
              ))
            ) : (
              <Row><span className="row-s">{t.noMatch(q.trim())}</span></Row>
            )}
          </Card>
        )}
        <h2 className="h">{t.yourServices}</h2>
        <div className="stack">
          {DEPTS.map((d) => (
            <Card key={d} variant="service">
              <Row icon={<RowIcon icon={SVC_ICON[d]} svc={d} size={20} />} title={t.svc[d]} sub={t.dept[d] + (linked[d] ? '' : t.notLinkedSuffix)} chevron onClick={() => nav.go(d)} />
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
