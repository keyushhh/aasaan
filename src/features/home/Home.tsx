import { useEffect, useState } from 'react';
import { AlertCard } from '../../components/AlertCard';
import { Button } from '../../components/Button';
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
  const [lead] = items;
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
      <div className={s.ground} aria-hidden="true" />
      <header className={`${s.head} ${enter ? s.enter : ''}`}>
        <div className={s.bar}>
          <span className="logo" aria-hidden="true">{name[0]}</span>
          <span className={s.who}>
            <span className={s.hi}>{t.hello}, {first}</span>
            <span className={s.date}>{date}</span>
          </span>
          <button type="button" className={s.round} aria-label={t.searchLabel} onClick={() => nav.tab('services')}>
            <Icon name="search" size={22} />
          </button>
        </div>
      </header>
      <main className={`pad ${enter ? s.enter : ''}`} id="main">
        <section className={s.hero} aria-labelledby="hero-count">
          <span className={s.heroLabel}>{t.attention}</span>
          {items.length ? (
            <h1 className={s.count} id="hero-count">
              <span className={s.num}>{items.length}</span>
              <span className={s.lbl}>{t.needYou(items.length, first)}</span>
            </h1>
          ) : (
            <h1 className={s.clear} id="hero-count"><span className={s.clearMark}><Icon name="check" size={18} /></span>{t.allClear}</h1>
          )}
          {epf ? (
            <button type="button" className={s.chip} onClick={() => nav.go('epf')}>
              <span className={s.chipIc}><Icon name="wallet" size={14} /></span>{t.totalPf}: <b>{inr(epf.employee + epf.employer)}</b>
            </button>
          ) : (
            <button type="button" className={s.chip} onClick={() => nav.tab('requests')}>
              <span className={s.chipIc}><Icon name="list" size={14} /></span>{t.inProgress}: <b>{open}</b>
            </button>
          )}
          <div className={s.actions}>
            {lead && <Button variant="primary" icon={lead.icon} onClick={() => run(lead.target)}>{lead.cta}</Button>}
            <Button variant="primary" icon="search" onClick={() => nav.tab('services')}>{t.searchLabel}</Button>
          </div>
        </section>

        {items.length > 0 && <h2 className="h"><Icon name="receipt" size={22} />{t.attention}</h2>}
        {items.length > 0 && <Card variant="list" className={s.queue}>{items.map((x) => <AlertCard key={x.key} {...strip(x)} onClick={() => run(x.target)} />)}</Card>}

        <h2 className="h"><Icon name="grid" size={22} />{t.yourServices}</h2>
        <Card variant="list" className={s.list}>
          {DEPTS.map((d) => <ServiceTile key={d} svc={d} icon={SVC_ICON[d]} name={t.svc[d]} state={state(d)} down={linked[d] && down[d]} onClick={() => nav.go(d)} />)}
        </Card>
        <h2 className="h"><Icon name="clock" size={22} />{t.recent}</h2>
        <Card variant="list" className={s.list}>{requests.slice(0, 3).map((r) => <RequestRow key={r.id} r={r} />)}</Card>
      </main>
    </>
  );
}
