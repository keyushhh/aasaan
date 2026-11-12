import { useEffect, useState } from 'react';
import { AlertCard } from '../../components/AlertCard';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { ServiceTile } from '../../components/ServiceTile';
import { DEPTS } from '../../data/types';
import { useChallans, useConsents, useDepartments, useEpfSummary, useRegistration, useRequests } from '../../data/hooks';
import { inr } from '../../lib/format';
import { SVC_ICON, useNav } from '../../app/nav';
import { useSession, useT } from '../../app/session';
import { RequestRow } from '../requests/RequestRow';
import { useOpenRequest } from '../requests/RequestSheet';
import { useOpenPay } from '../vehicle/PaySheet';
import { attention, type Attention, type Target } from './attention';
import s from './Home.module.css';

const strip = ({ key: _k, svc: _s, target: _t, ...x }: Attention) => x;

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
  const epf = useEpfSummary(linked.epf).data;
  const openRequest = useOpenRequest();
  const openPay = useOpenPay();
  const [enter] = useState(() => !entered);
  useEffect(() => void (entered = true), []);

  const items = attention({ challans, registration, consents, requests, linked, down }, t);
  const [lead, ...rest] = items;
  const open = requests.filter((r) => r.status !== 'done').length;
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
        <div className={s.bar}>
          <span className={s.brand}><span className="logo" aria-hidden="true">आ</span>{t.brand}</span>
          <span className={s.date}>{date}</span>
          <button type="button" className={s.round} aria-label={t.searchLabel} onClick={() => nav.tab('services')}>
            <Icon name="search" size={19} />
          </button>
        </div>
      </header>
      <main className={`pad ${enter ? s.enter : ''}`} id="main">
        <div className={s.bento}>
          <section className={`${s.panel} ${s.count}`} aria-labelledby="hero-count">
            <span className="label">{items.length ? t.attention : `${t.hello}, ${first}`}</span>
            {items.length ? (
              <h1 className={s.countIn} id="hero-count">
                <span className={s.num}>{items.length}</span>
                <span className={s.lbl}>{t.needYou(items.length, first)}</span>
              </h1>
            ) : (
              <h1 className={s.clear} id="hero-count"><span className={s.clearMark}><Icon name="check" size={20} /></span>{t.allClear}</h1>
            )}
          </section>

          {epf ? (
            <button type="button" className={`${s.panel} ${s.stat}`} data-svc="epf" onClick={() => nav.go('epf')}>
              <span className="label">{t.totalPf}</span>
              <span className={s.statNum}>{inr(epf.employee + epf.employer)}</span>
              <span className={s.statSub}>{t.dept.epf}<Icon name="chev" size={14} /></span>
            </button>
          ) : (
            <button type="button" className={`${s.panel} ${s.stat}`} onClick={() => nav.tab('requests')}>
              <span className="label">{t.tabs.requests}</span>
              <span className={s.statNum}>{open}</span>
              <span className={s.statSub}>{t.inProgress}<Icon name="chev" size={14} /></span>
            </button>
          )}

          {lead && <div className={s.lead}><AlertCard {...strip(lead)} first onClick={() => run(lead.target)} /></div>}
          {rest.length > 0 && <div className={s.more}>{rest.map((x) => <AlertCard key={x.key} {...strip(x)} first={false} compact onClick={() => run(x.target)} />)}</div>}
        </div>

        <h2 className="h">{t.yourServices}</h2>
        <div className={s.tiles}>
          {DEPTS.map((d) => <ServiceTile key={d} svc={d} icon={SVC_ICON[d]} name={t.svc[d]} state={state(d)} down={linked[d] && down[d]} onClick={() => nav.go(d)} />)}
        </div>
        <h2 className="h">{t.recent}</h2>
        <Card variant="list" className={s.recent}>{requests.slice(0, 3).map((r) => <RequestRow key={r.id} r={r} />)}</Card>
      </main>
    </>
  );
}
