import { Card } from '../../components/Card';
import { Empty } from '../../components/Empty';
import { TopBar } from '../../components/TopBar';
import { useRequests } from '../../data/hooks';
import { useT } from '../../app/session';
import { RequestRow } from './RequestRow';
import s from './Requests.module.css';

export function Requests() {
  const t = useT();
  const all = useRequests().data ?? [];
  const active = all.filter((r) => r.status !== 'done');
  const done = all.filter((r) => r.status === 'done');
  return (
    <>
      <TopBar title={t.tabs.requests} />
      <main className="pad" id="main">
        <p className={`note ${s.intro}`}>{t.requestsIntro}</p>
        <h2 className="h">{t.inProgress}</h2>
        {active.length ? <Card variant="list">{active.map((r) => <RequestRow key={r.id} r={r} />)}</Card> : <Empty icon="list">{t.nothingInProgress}</Empty>}
        <h2 className="h">{t.completed}</h2>
        {done.length ? <Card variant="list">{done.map((r) => <RequestRow key={r.id} r={r} />)}</Card> : <Empty icon="check">{t.nothingCompleted}</Empty>}
      </main>
    </>
  );
}
