import { useEffect, useState } from 'react';
import { AlertCard } from '../../components/AlertCard';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
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

const TONES = ['danger', 'warn', 'info'] as const;

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
  const byDept = DEPTS.map((d) => [d, items.filter((x) => x.svc === d).length] as const).filter(([, n]) => n > 0);
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
          <button type="button" className={s.chip} aria-label={`${t.tabs.requests}: ${open}`} onClick={() => nav.tab('requests')}>
            <Icon name="clock" size={18} />{open}
          </button>
          <button type="button" className={s.round} aria-label={t.searchLabel} onClick={() => nav.tab('services')}>
            <Icon name="search" size={19} />
          </button>
        </div>
        <section className={s.hero} aria-labelledby="hero-count">
          <div className={s.heroTop}>
            <span>{items.length ? t.attention : `${t.hello}, ${first}`}</span>
            <span>{date}</span>
          </div>
          {items.length ? (
            <>
              <h1 className={s.count} id="hero-count">
                <span className={s.num}>{items.length}</span>
                <span className={s.lbl}>{t.needYou(items.length, first)}</span>
              </h1>
              <div className={s.meter} aria-hidden="true">
                {TONES.map((tone) => {
                  const n = items.filter((x) => x.tone === tone).length;
                  return n ? <span key={tone} className={s[tone]} style={{ flexGrow: n }} /> : null;
                })}
              </div>
              <div className={s.depts}>
                {byDept.map(([d, n]) => (
                  <button key={d} type="button" className={s.dept} data-svc={d} aria-label={t.deptCount(t.svc[d], n)} onClick={() => nav.go(d)}>
                    <span className={s.deptMark}><Icon name={SVC_ICON[d]} size={15} /></span>{n}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <h1 className={s.clear} id="hero-count">
              <span className={s.clearMark}><Icon name="check" size={22} /></span>{t.allClear}
            </h1>
          )}
        </section>
      </header>
      <main className="pad" id="main">
        <div className={s.queue}>
          {items.map(({ key, target, svc: _svc, ...x }, i) => <AlertCard key={key} {...x} first={i === 0} onClick={() => run(target)} />)}
        </div>
        <h2 className="h">{t.yourServices}</h2>
        <div className={s.tiles}>
          {DEPTS.map((d) => <ServiceTile key={d} svc={d} icon={SVC_ICON[d]} name={t.svc[d]} state={state(d)} down={linked[d] && down[d]} onClick={() => nav.go(d)} />)}
        </div>
        <h2 className="h">{t.recent}</h2>
        <Card variant="list">{requests.slice(0, 3).map((r) => <RequestRow key={r.id} r={r} />)}</Card>
      </main>
    </>
  );
}
