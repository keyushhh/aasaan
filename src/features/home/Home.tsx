import { useEffect, useState } from 'react';
import { AlertCard } from '../../components/AlertCard';
import { Card } from '../../components/Card';
import { ServiceTile } from '../../components/ServiceTile';
import { DEPTS } from '../../data/types';
import { useChallans, useConsents, useDepartments, useRegistration, useRequests } from '../../data/hooks';
import { SVC_ICON, useNav } from '../../app/nav';
import { useSession, useT } from '../../app/session';
import { RequestRow } from '../requests/RequestRow';
import { useOpenRequest } from '../requests/RequestSheet';
import { useOpenPay } from '../vehicle/PaySheet';
import { attention, type Target } from './attention';
import s from './Home.module.css';

/** The entrance animation plays once per app session. */
let entered = false;

export function Home() {
  const t = useT();
  const nav = useNav();
  const { name } = useSession();
  const { linked, down } = useDepartments();
  const challans = useChallans().data ?? [];
  const registration = useRegistration().data;
  const consents = useConsents().data ?? [];
  const requests = useRequests().data ?? [];
  const openRequest = useOpenRequest();
  const openPay = useOpenPay();
  const [enter] = useState(() => !entered);
  useEffect(() => void (entered = true), []);

  const items = attention({ challans, registration, consents, requests, linked, down }, t);
  const first = name.split(' ')[0];
  const date = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const run = (target: Target) => {
    if (target.kind === 'pay') openPay(target.id);
    else if (target.kind === 'request') openRequest(target.r);
    else nav.go(target.route);
  };
  const state = (d: (typeof DEPTS)[number]) => (!linked[d] ? t.notLinked : down[d] ? t.isDown(t.dept[d]) : t.dept[d]);

  return (
    <>
      <header className={`${s.head} ${enter ? s.enter : ''}`}>
        <div className={s.brand}>
          <span className="logo" aria-hidden="true">आ</span>
          <span>{t.brand}</span>
          <span className={s.date}>{date}</span>
        </div>
        <h1 className={s.count}>
          <span className={s.num}>{items.length}</span>
          <span className={s.lbl}>{t.needYou(items.length, first)}</span>
        </h1>
      </header>
      <main className="pad" id="main">
        {items.map(({ key, target, ...x }, i) => <AlertCard key={key} {...x} first={i === 0} onClick={() => run(target)} />)}
        <h2 className="h">{t.yourServices}</h2>
        <div className={s.tiles}>
          {DEPTS.map((d) => <ServiceTile key={d} svc={d} icon={SVC_ICON[d]} name={t.svc[d]} state={state(d)} onClick={() => nav.go(d)} />)}
        </div>
        <h2 className="h">{t.recent}</h2>
        <Card variant="list">{requests.slice(0, 3).map((r) => <RequestRow key={r.id} r={r} />)}</Card>
      </main>
    </>
  );
}
