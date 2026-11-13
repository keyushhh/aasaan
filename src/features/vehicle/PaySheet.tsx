import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { en } from '../../i18n/strings';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { KeyValue } from '../../components/KeyValue';
import { MonoIn } from '../../components/MonoIn';
import { Pill } from '../../components/Pill';
import { SheetTitle, useSheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { DepartmentUnavailable, type Challan, type PayMethod, type Receipt } from '../../data';
import { useActions, useChallans, useDepartments } from '../../data/hooks';
import { fd, inr } from '../../lib/format';
import { useT } from '../../app/session';
import s from './PaySheet.module.css';

function PaySheet({ id }: { id: string }) {
  const t = useT();
  const sheet = useSheet();
  const act = useActions();
  const { down } = useDepartments();
  const c = useChallans().data?.find((x) => x.id === id);
  const [method, setMethod] = useState<PayMethod>(en.payMethods[0] as PayMethod);
  const [paying, setPaying] = useState(false);
  if (!c) return null;
  const paused = down.vehicle;

  const pay = async () => {
    setPaying(true);
    try {
      const receipt = await act.payChallan(c.id, method);
      sheet.set(<PaidSheet c={c} receipt={receipt} method={method} />);
    } catch (e) {
      if (!(e instanceof DepartmentUnavailable)) throw e;
      setPaying(false); // the paused banner takes over
    }
  };

  return (
    <>
      <SheetTitle>{t.payTitle}</SheetTitle>
      <p className="row-s">{c.offence}, {fd(c.date)}<br /><MonoIn line={t.challanNo(c.no)} part={c.no} /></p>
      <div className={`big ${s.amount}`}>{inr(c.amount)}</div>
      <Select<PayMethod> field label={t.payWith} value={method} onChange={setMethod}
        options={en.payMethods.map((m, i) => [m as PayMethod, t.payMethods[i]] as const)} />
      {paused && <Banner spacing="pay" title={t.paymentsPausedTitle}>{t.paymentsPausedBody}</Banner>}
      <Button variant="primary" block trail="chev" disabled={paused || paying} onClick={pay}>{paying ? t.confirming : t.pay(inr(c.amount))}</Button>
      <p className={`note ${s.note}`}>{t.noMoney}</p>
    </>
  );
}

function PaidSheet({ c, receipt, method }: { c: Challan; receipt: Receipt; method: PayMethod }) {
  const t = useT();
  const sheet = useSheet();
  const toast = useToast();
  return (
    <>
      <div className={s.success}>
        <div className={s.ring}><Icon name="check" size={32} /></div>
        <SheetTitle>{t.challanPaid}</SheetTitle>
        <p className="row-s">{t.paidFor(inr(receipt.amount), c.no)}</p>
      </div>
      <Card className={s.receipt}>
        <KeyValue items={[
          [t.amountPaid, inr(receipt.amount)],
          [t.challanNoLabel, <span className="mono">{receipt.challanNo}</span>],
          [t.paidTo, t.dept.vehicle],
          [t.paidWith, t.payMethods[en.payMethods.indexOf(method)]],
          [t.utr, <span className="mono">{receipt.utr}</span>],
          [t.paidOn, fd(receipt.paidOn)],
          [t.status, <Pill tone="ok">{t.closed}</Pill>],
        ]} />
      </Card>
      <div className="btn-row">
        <Button icon="download" onClick={() => toast(t.downloadToast)}>{t.receipt}</Button>
        <Button variant="primary" onClick={sheet.close}>{t.done}</Button>
      </div>
    </>
  );
}

export function useOpenPay() {
  const sheet = useSheet();
  const qc = useQueryClient();
  return (id: string) => {
    const c = qc.getQueryData<Challan[]>(['vehicle', 'challans'])?.find((x) => x.id === id);
    if (c && !c.paid) sheet.open(<PaySheet id={id} />);
  };
}
