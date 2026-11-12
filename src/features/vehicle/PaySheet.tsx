import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { KeyValue } from '../../components/KeyValue';
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
  const [method, setMethod] = useState<PayMethod>(t.payMethods[0]);
  const [paying, setPaying] = useState(false);
  if (!c) return null;
  const paused = down.vehicle;

  const pay = async () => {
    setPaying(true);
    try {
      const receipt = await act.payChallan(c.id, method);
      sheet.set(<PaidSheet c={c} receipt={receipt} />);
    } catch (e) {
      if (!(e instanceof DepartmentUnavailable)) throw e;
      setPaying(false); // the paused banner takes over
    }
  };

  return (
    <>
      <SheetTitle>{t.payTitle}</SheetTitle>
      <p className="row-s">{c.offence}, {fd(c.date)}<br />{t.challanNo(c.no)}</p>
      <div className={`big ${s.amount}`}>{inr(c.amount)}</div>
      <Field label={t.payWith}>
        <select value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
          {t.payMethods.map((m) => <option key={m}>{m}</option>)}
        </select>
      </Field>
      {paused && <Banner spacing="pay" title={t.paymentsPausedTitle}>{t.paymentsPausedBody}</Banner>}
      <Button variant="primary" block disabled={paused || paying} onClick={pay}>{paying ? t.confirming : t.pay(inr(c.amount))}</Button>
      <p className={`note ${s.note}`}>{t.noMoney}</p>
    </>
  );
}

function PaidSheet({ c, receipt }: { c: Challan; receipt: Receipt }) {
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
      <KeyValue items={[[t.utr, receipt.utr], [t.paidOn, fd(receipt.paidOn)], [t.status, <Pill tone="ok">{t.closed}</Pill>]]} />
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
