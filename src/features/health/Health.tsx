import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { Row } from '../../components/Row';
import { useToast } from '../../components/Toast';
import { DepartmentUnavailable } from '../../data';
import { useAbha, useActions, useConsents, useDepartments, useRecords } from '../../data/hooks';
import { fd } from '../../lib/format';
import { useT } from '../../app/session';
import { ServiceScreen } from '../ServiceScreen';
import s from './Health.module.css';

export function Health() {
  const t = useT();
  const toast = useToast();
  const act = useActions();
  const on = useDepartments().linked.health;
  const abha = useAbha(on), consents = useConsents(on), records = useRecords(on);

  const respond = async (id: string, decision: 'allowed' | 'denied') => {
    try {
      const c = await act.respondToConsent(id, decision);
      toast(decision === 'allowed' ? t.accessAllowed(c.until) : t.requestDenied);
    } catch (e) {
      if (e instanceof DepartmentUnavailable) toast(t.healthDown);
      else throw e;
    }
  };

  return (
    <ServiceScreen svc="health" queries={[abha, consents, records]}>
      {() => (
        <>
          <Card variant="hero">
            <div className="label">{t.abhaNumber}</div>
            <div className="big md">{abha.data!.number}</div>
            <div className="row-s">{abha.data!.address}</div>
            <Button block icon="download" onClick={() => toast(t.downloadToast)}>{t.downloadAbha}</Button>
          </Card>
          <h2 className="h">{t.recordRequests}</h2>
          <div className="stack">
            {consents.data!.map((c) => (
              <Card key={c.id}>
                <span className="row-t">{c.from}</span>
                <span className="row-s">{t.consentLine(c.what, c.purpose, c.until)}</span>
                {c.status === 'pending' ? (
                  <div className="btn-row">
                    <Button onClick={() => respond(c.id, 'denied')}>{t.deny}</Button>
                    <Button variant="primary" onClick={() => respond(c.id, 'allowed')}>{t.allowFor(c.until)}</Button>
                  </div>
                ) : (
                  <div className={s.status}>{c.status === 'allowed' ? <Pill tone="ok">{t.allowed}</Pill> : <Pill>{t.denied}</Pill>}</div>
                )}
              </Card>
            ))}
          </div>
          <h2 className="h">{t.yourRecords}</h2>
          <Card variant="list">{records.data!.map((r) => <Row key={r.name} title={r.name} sub={`${r.facility}, ${fd(r.date)}`} />)}</Card>
        </>
      )}
    </ServiceScreen>
  );
}
