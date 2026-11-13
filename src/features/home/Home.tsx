import { useEffect, useState } from 'react';
import { AlertCard } from '../../components/AlertCard';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Row } from '../../components/Row';
import { ServiceTile } from '../../components/ServiceTile';
import { Switch } from '../../components/Switch';
import { useToast } from '../../components/Toast';
import { cx } from '../../components/cx';
import { DEPTS } from '../../data/types';
import { useChallans, useConsents, useDepartments, useEpfSummary, useLicence, useRegistration, useRequests } from '../../data/hooks';
import { fd, fday, inr, num } from '../../lib/format';
import { SVC_ICON, useNav } from '../../app/nav';
import { setSession, useSession, useT } from '../../app/session';
import { RequestRow } from '../requests/RequestRow';
import { useOpenRequest } from '../requests/RequestSheet';
import { useOpenPay } from '../vehicle/PaySheet';
import { attention, type Attention, type Target } from './attention';
import { deadlines } from './deadlines';
import s from './Home.module.css';

const strip = ({ key: _k, svc: _s, target: _t, ...x }: Attention) => x;

/** The entrance animation plays once per app session. */
let entered = false;

export function Home() {
  const t = useT();
  const nav = useNav();
  const toast = useToast();
  const { name, reminders = [] } = useSession();
  const { linked, down } = useDepartments();
  const challans = useChallans().data ?? [];
  const registration = useRegistration().data;
  const licence = useLicence(linked.vehicle).data;
  const consents = useConsents().data ?? [];
  const requests = useRequests().data ?? [];
  const epf = useEpfSummary(linked.epf).data;
  const openRequest = useOpenRequest();
  const openPay = useOpenPay();
  const [enter] = useState(() => !entered);
  useEffect(() => void (entered = true), []);

  const items = attention({ challans, registration, consents, requests, linked, down }, t);
  const [lead] = items;
  const dates = deadlines({ registration: linked.vehicle ? registration : undefined, licence, tax: linked.tax }, t);
  const open = requests.filter((r) => r.status !== 'done').length;
  const saved = requests.filter((r) => r.status === 'queued').length;
  const first = name.split(' ')[0];
  const remind = (key: string) => {
    const on = !reminders.includes(key);
    setSession({ reminders: on ? [...reminders, key] : reminders.filter((k) => k !== key) });
    toast(on ? t.reminderOn : t.reminderOff);
  };
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
            <span className={s.date}>{fday(Date.now())}</span>
          </span>
        </div>
      </header>
      <main className={`pad ${enter ? s.enter : ''}`} id="main">
        <section className={s.hero} aria-labelledby="hero-count">
          <span className={s.heroLabel}>{t.today}</span>
          {items.length ? (
            <h1 className={s.count} id="hero-count">
              <span className={s.num}>{num(items.length)}</span>
              <span className={s.lbl}>{t.needYou(items.length)}</span>
            </h1>
          ) : (
            <>
              <h1 className={s.clear} id="hero-count"><span className={s.clearMark}><Icon name="check" size={18} /></span>{t.allClear}</h1>
              {dates[0] && <p className={s.next}>{t.nextUp(dates[0].title, fd(dates[0].date))}</p>}
            </>
          )}
          {epf ? (
            <button type="button" className={s.chip} onClick={() => nav.go('epf')}>
              <span className={s.chipIc}><Icon name="wallet" size={14} /></span>{t.totalPf}: <b>{inr(epf.employee + epf.employer)}</b>
            </button>
          ) : (
            <button type="button" className={s.chip} onClick={() => nav.tab('requests')}>
              <span className={s.chipIc}><Icon name="list" size={14} /></span>{t.inProgress}: <b>{num(open)}</b>
            </button>
          )}
          {saved > 0 && (
            <button type="button" className={s.saved} onClick={() => nav.tab('requests')}>
              <Icon name="clock" size={16} />{t.waiting(saved)}
            </button>
          )}
          {lead && (
            <div className={s.actions}>
              <Button variant="primary" icon={lead.icon} onClick={() => run(lead.target)}>{lead.cta}</Button>
            </div>
          )}
        </section>

        {items.length > 0 && (
          <section aria-labelledby="queue-h">
            <h2 className="h" id="queue-h"><Icon name="list" size={22} />{t.attention}</h2>
            <Card variant="list" className={s.list}>{items.map((x) => <AlertCard key={x.key} {...strip(x)} onClick={() => run(x.target)} />)}</Card>
          </section>
        )}

        {dates.length > 0 && (
          <section aria-labelledby="dates-h">
            <h2 className="h" id="dates-h"><Icon name="clock" size={22} />{t.comingUp}</h2>
            <Card variant="rows" className={s.list}>
              {dates.map((d) => (
                <Row key={d.key} title={d.title} sub={`${fd(d.date)}, ${t.dept[d.svc]}`}
                  icon={<span className={cx(s.days, d.days <= 30 && s.soon)} aria-hidden="true"><b>{num(d.days)}</b>{t.dayUnit(d.days)}</span>}
                  right={<Switch checked={reminders.includes(d.key)} label={t.remindMe(d.title)} onChange={() => remind(d.key)} />} />
              ))}
            </Card>
          </section>
        )}

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
