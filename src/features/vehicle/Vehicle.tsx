import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { KeyValue } from '../../components/KeyValue';
import { Pill } from '../../components/Pill';
import { Row } from '../../components/Row';
import { useChallans, useDepartments, useLicence, useRegistration } from '../../data/hooks';
import { daysTo, fd, inr } from '../../lib/format';
import { useT } from '../../app/session';
import type { Strings } from '../../i18n/strings';
import { ServiceScreen } from '../ServiceScreen';
import { useOpenPay } from './PaySheet';

export function Validity({ date, t }: { date: string; t: Strings }) {
  const days = daysTo(date);
  if (days < 0) return <Pill tone="danger">{t.expired(fd(date))}</Pill>;
  if (days <= 30) return <Pill tone="warn">{t.expiresIn(days)}</Pill>;
  return <Pill tone="ok">{t.validTill(fd(date))}</Pill>;
}

export function Vehicle() {
  const t = useT();
  const on = useDepartments().linked.vehicle;
  const reg = useRegistration(on), lic = useLicence(on), challans = useChallans(on);
  const openPay = useOpenPay();
  return (
    <ServiceScreen svc="vehicle" queries={[reg, lic, challans]}>
      {() => {
        const r = reg.data!, l = lic.data!;
        return (
          <>
            <Card variant="hero">
              <div className="label">{t.rcLabel}</div>
              <div className="big md mono">{r.number}</div>
              <div className="row-s">{t.rcLine(r.model, r.fuel, fd(r.registered))}</div>
              <KeyValue items={[
                [t.insurance, <Validity date={r.insuranceTill} t={t} />],
                [t.puc, <Validity date={r.pucTill} t={t} />],
                [t.fitness, <Pill tone="ok">{t.validTill(fd(r.fitnessTill))}</Pill>],
              ]} />
            </Card>
            <h2 className="h">{t.challans}</h2>
            <Card variant="list">
              {challans.data!.map((c) => (
                <Row key={c.id} title={c.offence} sub={`${c.place}, ${fd(c.date)}`}
                  right={c.paid ? <Pill tone="ok">{t.paid}</Pill> : <Button variant="primary" small onClick={() => openPay(c.id)}>{t.pay(inr(c.amount))}</Button>} />
              ))}
            </Card>
            <h2 className="h">{t.licence}</h2>
            <Card>
              <span className="row-t mono">{l.number}</span>
              <span className="row-s">{t.licenceLine(l.classes, l.rto)}</span>
              <KeyValue items={[[t.status, <Pill tone="ok">{l.status}</Pill>], [t.validTillLabel, fd(l.validTill)]]} />
            </Card>
          </>
        );
      }}
    </ServiceScreen>
  );
}
