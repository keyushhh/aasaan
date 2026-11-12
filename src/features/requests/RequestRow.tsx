import { Pill } from '../../components/Pill';
import { Row, RowIcon } from '../../components/Row';
import type { Request } from '../../data';
import { SVC_ICON } from '../../app/nav';
import { useT } from '../../app/session';
import { useOpenRequest } from './RequestSheet';

export const currentStep = (r: Request) => (r.steps.find((s) => s.state === 'current') ?? r.steps[r.steps.length - 1]).label;

export function StatusPill({ r }: { r: Request }) {
  const t = useT();
  if (r.status === 'done') return <Pill tone="ok">{t.completed}</Pill>;
  if (r.status === 'queued') return <Pill tone="warn">{t.queued}</Pill>;
  return <Pill tone="info">{t.inProgress}</Pill>;
}

export function RequestRow({ r }: { r: Request }) {
  const open = useOpenRequest();
  return <Row icon={<RowIcon icon={SVC_ICON[r.svc]} svc={r.svc} />} title={r.title} sub={currentStep(r)} right={<StatusPill r={r} />} onClick={() => open(r)} />;
}
