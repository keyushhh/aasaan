import { num } from '../../lib/format';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useSheet } from '../../components/Sheet';
import { ComplaintSheet } from './ComplaintSheet';
import { Empty } from '../../components/Empty';
import { TopBar } from '../../components/TopBar';
import { useRequests } from '../../data/hooks';
import { useT } from '../../app/session';
import { RequestRow } from './RequestRow';
import s from './Requests.module.css';

export function Requests() {
  const t = useT();
  const sheet = useSheet();
  const all = useRequests().data ?? [];
  const active = all.filter((r) => r.status !== 'done');
  const done = all.filter((r) => r.status === 'done');
  return (
    <>
      <TopBar title={t.tabs.requests} />
      <main className="pad" id="main">
        <p className={`note ${s.intro}`}>{t.requestsIntro}</p>
        <Button icon="message" block onClick={() => sheet.open(<ComplaintSheet />)}>{t.raiseComplaint}</Button>
        <div className={s.summary}>
          <Card><b>{num(active.length)}</b><span>{t.inProgress}</span></Card>
          <Card><b>{num(done.length)}</b><span>{t.completed}</span></Card>
        </div>
        <h2 className="h">{t.inProgress}</h2>
        {active.length ? <Card variant="list">{active.map((r) => <RequestRow key={r.id} r={r} />)}</Card> : <Empty icon="list">{t.nothingInProgress}</Empty>}
        <h2 className="h">{t.completed}</h2>
        {done.length ? <Card variant="list">{done.map((r) => <RequestRow key={r.id} r={r} />)}</Card> : <Empty icon="check">{t.nothingCompleted}</Empty>}
      </main>
    </>
  );
}
