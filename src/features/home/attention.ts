import type { AlertCardProps } from '../../components/AlertCard';
import { DEPTS, type Challan, type ConsentRequest, type Dept, type FamilyMember, type Registration, type Request } from '../../data/types';
import type { Strings } from '../../i18n/strings';
import { daysTo, fd, inr } from '../../lib/format';
import { SVC_ICON, type Route } from '../../app/nav';
import { currentStep, stepDays } from '../requests/RequestRow';

export type Target = { kind: 'pay'; id: string } | { kind: 'go'; route: Route } | { kind: 'path'; to: string } | { kind: 'request'; r: Request };
export type Attention = Omit<AlertCardProps, 'onClick'> & { key: string; svc: Dept; target: Target };

interface Input {
  challans: Challan[];
  registration?: Registration;
  consents: ConsentRequest[];
  requests: Request[];
  linked: Record<Dept, boolean>;
  down: Record<Dept, boolean>;
  family?: FamilyMember[];
}

/** Everything on the home queue, in the reference's order. */
export function attention({ challans, registration, consents, requests, linked, down, family = [] }: Input, t: Strings): Attention[] {
  const a: Attention[] = [];
  const att = t.att;
  challans.filter((c) => !c.paid).forEach((c) =>
    a.push({ key: 'c' + c.id, svc: 'vehicle', tone: 'danger', icon: 'alert', title: att.challanTitle(inr(c.amount)), body: `${c.offence}, ${fd(c.date)}`, cta: att.payChallan, target: { kind: 'pay', id: c.id } }),
  );
  if (registration) {
    const p = daysTo(registration.pucTill);
    if (p <= 30)
      a.push({ key: 'puc', svc: 'vehicle', tone: 'warn', icon: 'clock', title: p < 0 ? att.pucExpired : att.pucExpires(p), body: att.pucBody(registration.number), cta: att.viewPuc, target: { kind: 'go', route: 'vehicle' } });
  }
  family.filter((f) => f.pension && !f.pension.lcDone && daysTo(f.pension.lcDue) <= 30).forEach((f) =>
    a.push({ key: 'lc' + f.id, svc: 'epf', tone: 'warn', icon: 'user', title: att.lcTitle(f.name.split(' ')[0], fd(f.pension!.lcDue)), body: att.lcBody, cta: att.submitLc, target: { kind: 'path', to: `/family/${f.id}` } }),
  );
  consents.filter((c) => c.status === 'pending').forEach((c) =>
    a.push({ key: 'k' + c.id, svc: 'health', tone: 'info', icon: 'shield', title: att.consentTitle(c.from), body: att.consentBody(c.purpose), cta: att.review, target: { kind: 'go', route: 'health' } }),
  );
  requests.filter((r) => r.status !== 'done').forEach((r) =>
    a.push({ key: 'r' + r.id, svc: r.svc, tone: r.status === 'queued' ? 'warn' : 'info', icon: SVC_ICON[r.svc], title: r.title, body: att.now(stepDays(r) ? t.workingDay(currentStep(r), stepDays(r)!) : currentStep(r)), cta: r.svc === 'epf' ? att.trackClaim : att.trackRequest, target: { kind: 'request', r } }),
  );
  DEPTS.filter((d) => down[d] && linked[d]).forEach((d) =>
    a.push({ key: 'd' + d, svc: d, tone: 'warn', icon: 'alert', title: att.downTitle(t.dept[d]), body: att.downBody, cta: att.open(t.dept[d]), target: { kind: 'go', route: d } }),
  );
  return a;
}
