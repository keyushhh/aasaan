import { Button } from '../../components/Button';
import { Empty } from '../../components/Empty';
import { Card } from '../../components/Card';
import { MonoIn } from '../../components/MonoIn';
import { Row } from '../../components/Row';
import { useSheet } from '../../components/Sheet';
import { useDepartments, useEpfSummary, usePassbook, useRequests } from '../../data/hooks';
import { fd, inr } from '../../lib/format';
import { useT } from '../../app/session';
import { RequestRow } from '../requests/RequestRow';
import { ServiceScreen } from '../ServiceScreen';
import { ClaimSheet } from './ClaimSheet';
import s from './Epf.module.css';

export function Epf() {
  const t = useT();
  const sheet = useSheet();
  const on = useDepartments().linked.epf;
  const summary = useEpfSummary(on), passbook = usePassbook(on);
  const claims = (useRequests().data ?? []).filter((r) => r.svc === 'epf');
  return (
    <ServiceScreen svc="epf" queries={[summary, passbook]}>
      {() => {
        const e = summary.data!, b = passbook.data!;
        return (
          <>
            <Card variant="hero" data-svc="epf">
              <div className="label">{t.totalPf}</div>
              <div className="big">{inr(e.employee + e.employer)}</div>
              <div className={s.split}>
                <div><span>{t.yourShare}</span><b>{inr(e.employee)}</b></div>
                <div><span>{t.employerShare}</span><b>{inr(e.employer)}</b></div>
                <div><span>{t.pension}</span><b>{inr(e.eps)}</b></div>
              </div>
              <div className="meta"><MonoIn line={t.uanLine(e.uan, e.org)} part={e.uan} /></div>
            </Card>
            <Button variant="primary" block trail="chev" onClick={() => sheet.open(<ClaimSheet eligible={e.eligible} />)}>{t.withdraw}</Button>
            <h2 className="h">{t.yourClaims}</h2>
            {claims.length ? <Card variant="list">{claims.map((r) => <RequestRow key={r.id} r={r} />)}</Card> : <Empty icon="wallet">{t.noClaims}</Empty>}
            <h2 className="h">{t.passbook}</h2>
            <Card variant="ledger">
              {b.months.map((m) => (
                <Row key={m.month} title={m.month} sub={t.passbookLine(inr(m.employee), inr(m.employer), inr(m.pension))} figure={'+' + inr(m.employee + m.employer)} />
              ))}
              <Row title={t.interestFor(b.interest.fy)} sub={t.credited(fd(b.interest.credited))} figure={'+' + inr(b.interest.amount)} />
            </Card>
          </>
        );
      }}
    </ServiceScreen>
  );
}
