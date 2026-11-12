import { useState, type FormEvent } from 'react';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Field } from '../../components/Field';
import { SheetTitle, useSheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import type { ClaimReason } from '../../data';
import { useActions, useDepartments } from '../../data/hooks';
import { inr } from '../../lib/format';
import { useT } from '../../app/session';
import { validateClaim } from './validateClaim';
import s from './Epf.module.css';

export function ClaimSheet({ eligible }: { eligible: number }) {
  const t = useT();
  const sheet = useSheet();
  const toast = useToast();
  const act = useActions();
  const down = useDepartments().down.epf;
  const [reason, setReason] = useState<ClaimReason>('Housing');
  const [raw, setRaw] = useState('');
  const [error, setError] = useState('');

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const v = validateClaim(raw, eligible, t);
    if ('error' in v) return setError(v.error);
    const out = await act.submitClaim({ reason, amount: v.amount });
    sheet.close();
    toast(out.queued ? t.claimQueued : t.claimSent);
  };

  return (
    <form onSubmit={submit} noValidate>
      <SheetTitle>{t.withdraw}</SheetTitle>
      <p className="row-s">{t.claimIntro(inr(eligible))}</p>
      {down && <Banner spacing="sheet" title={t.claimDownTitle}>{t.claimDownBody}</Banner>}
      <Field label={t.reason}>
        <select value={reason} onChange={(e) => setReason(e.target.value as ClaimReason)}>
          {t.reasons.map((r) => <option key={r}>{r}</option>)}
        </select>
      </Field>
      <Field label={t.amountLabel}>
        <input inputMode="numeric" placeholder={t.amountPlaceholder} autoComplete="off" value={raw} onChange={(e) => setRaw(e.target.value)} />
      </Field>
      <div className="err" role="alert">{error}</div>
      <Card className={s.bank}><span className="row-s">{t.payingInto}</span><span className="row-t">{t.payingBank}</span></Card>
      <Button type="submit" variant="primary" block>{down ? t.saveLater : t.submitClaim}</Button>
    </form>
  );
}
