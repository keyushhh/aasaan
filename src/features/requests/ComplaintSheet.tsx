import { useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { Select } from '../../components/Select';
import { SheetTitle, useSheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { DEPTS, type Dept } from '../../data/types';
import { useActions } from '../../data/hooks';
import { en } from '../../i18n/strings';
import { useT } from '../../app/session';

/**
 * Raise a complaint with a department's grievance system. It is tracked in Requests like anything else,
 * and waits on the phone if the department is down. The topic goes out in English, as departments file it.
 */
export function ComplaintSheet({ dept: initial = 'epf' }: { dept?: Dept }) {
  const t = useT();
  const sheet = useSheet();
  const toast = useToast();
  const act = useActions();
  const [dept, setDept] = useState<Dept>(initial);
  const [topic, setTopic] = useState(0);
  const [details, setDetails] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (details.trim().length < 5) return setErr(t.errComplaint);
    setBusy(true);
    const out = await act.raiseComplaint({ dept, topic: en.complaintTopics[dept][topic], details: details.trim() });
    sheet.close();
    toast(out.queued ? t.complaintQueued(t.dept[dept]) : t.complaintSent);
  };
  return (
    <form onSubmit={send} noValidate>
      <SheetTitle>{t.raiseComplaint}</SheetTitle>
      <p className="row-s">{t.complaintBody}</p>
      <Select<Dept> field label={t.complaintDept} value={dept} onChange={(d) => { setDept(d); setTopic(0); }} options={DEPTS.map((d) => [d, `${t.svc[d]}, ${t.dept[d]}`] as const)} />
      <Select<string> field label={t.complaintTopic} value={String(topic)} onChange={(v) => setTopic(Number(v))} options={t.complaintTopics[dept].map((x, i) => [String(i), x] as const)} />
      <Field label={t.complaintDetails}>
        <textarea rows={4} placeholder={t.complaintPlaceholder} value={details} onChange={(e) => { setDetails(e.target.value); setErr(''); }} />
      </Field>
      <div className="err" role="alert">{err}</div>
      <Button type="submit" variant="primary" block disabled={busy}>{t.sendComplaint}</Button>
    </form>
  );
}
