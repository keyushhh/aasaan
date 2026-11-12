import { Card } from '../../components/Card';
import { MonoIn } from '../../components/MonoIn';
import { Icon } from '../../components/Icon';
import { KeyValue } from '../../components/KeyValue';
import { Pill } from '../../components/Pill';
import { RowIcon } from '../../components/Row';
import { Timeline } from '../../components/Timeline';
import { useDepartments, usePanLink, useTaxDemands, useTaxReturn } from '../../data/hooks';
import { fd, inr } from '../../lib/format';
import { useT } from '../../app/session';
import { ServiceScreen } from '../ServiceScreen';
import s from './Tax.module.css';

export function Tax() {
  const t = useT();
  const on = useDepartments().linked.tax;
  const link = usePanLink(on), ret = useTaxReturn(on), demands = useTaxDemands(on);
  return (
    <ServiceScreen svc="tax" queries={[link, ret, demands]}>
      {() => {
        const l = link.data!, r = ret.data!;
        return (
          <>
            <Card className={s.pan}>
              <RowIcon icon="check" size={20} ok />
              <div><span className="row-t">{t.panLinked}</span><span className="row-s"><MonoIn line={t.panLine(l.pan, fd(l.linkedOn))} part={l.pan} /></span></div>
            </Card>
            <h2 className="h">{t.returnFor(r.ay)}</h2>
            <Card>
              <KeyValue flush items={[[t.form, r.form], [t.filedOn, fd(r.filedOn)], [t.status, <Pill tone="ok">{r.status}</Pill>], [t.refund, inr(r.refund)]]} />
              <Timeline steps={r.steps} />
            </Card>
            <h2 className="h">{t.demands}</h2>
            {demands.data!.length === 0 && <Card className={s.clear}><Icon name="check" size={20} /> {t.noDemand}</Card>}
          </>
        );
      }}
    </ServiceScreen>
  );
}
