import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { SheetTitle, useSheet } from '../../components/Sheet';
import { Timeline } from '../../components/Timeline';
import type { Request } from '../../data';
import { inr } from '../../lib/format';
import { useNav } from '../../app/nav';
import { useT } from '../../app/session';
import { stepDays } from './RequestRow';
import s from './Requests.module.css';

function RequestSheet({ r }: { r: Request }) {
  const t = useT();
  const nav = useNav();
  const sheet = useSheet();
  const days = stepDays(r);
  const step = r.steps.find((x) => x.state === 'current');
  return (
    <>
      <SheetTitle>{r.title}</SheetTitle>
      <p className="row-s"><span className="mono">{r.ref}</span>{r.amount ? <><br />{t.amount(inr(r.amount))}</> : null}</p>
      {r.status === 'queued' && <Banner icon="clock" spacing="sheet" title={t.savedTitle}>{t.savedBody(t.dept[r.svc])}</Banner>}
      {days && step && (
        <Card className={s.wait}>
          <span className="row-t">{t.workingDay(step.label, days)}</span>
          {step.note && <span className="row-s">{step.note}</span>}
        </Card>
      )}
      <Timeline steps={r.steps} />
      <div className="btn-row">
        <Button onClick={sheet.close}>{t.close}</Button>
        <Button variant="primary" trail="chev" onClick={() => nav.go(r.svc)}>{t.openSvc(t.svc[r.svc])}</Button>
      </div>
    </>
  );
}

export function useOpenRequest() {
  const sheet = useSheet();
  return (r: Request) => sheet.open(<RequestSheet r={r} />);
}
