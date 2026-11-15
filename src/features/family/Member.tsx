import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Empty } from '../../components/Empty';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { KeyValue } from '../../components/KeyValue';
import { Pill } from '../../components/Pill';
import { Row, RowIcon } from '../../components/Row';
import { Select } from '../../components/Select';
import { SheetTitle, useSheet } from '../../components/Sheet';
import { TopBar } from '../../components/TopBar';
import { useToast } from '../../components/Toast';
import { api } from '../../data';
import { InvalidOtp } from '../../data/services';
import type { FamilyMember, Relation } from '../../data/types';
import { useActions, useFamily } from '../../data/hooks';
import { fd, inr } from '../../lib/format';
import { useNav } from '../../app/nav';
import { useT } from '../../app/session';
import s from './Family.module.css';

const first = (name: string) => name.split(' ')[0];

/** One family member's records, managed with their consent: pension and life certificate, health ID. */
export function Member() {
  const t = useT();
  const nav = useNav();
  const sheet = useSheet();
  const toast = useToast();
  const act = useActions();
  const { id } = useParams();
  const m = useFamily().data?.find((f) => f.id === id);
  const stop = async () => {
    if (!m) return;
    await act.removeFamily(m.id);
    toast(t.stopped(m.name));
    nav.tab('profile');
  };

  return (
    <>
      <TopBar title={m?.name ?? t.family} dept={m ? t.relations[m.relation] : undefined} start={<IconButton icon="back" label={t.back} onClick={nav.back} />} />
      <main className="pad" id="main">
        {!m ? (
          <Empty icon="user">{t.noFamilyRecords}</Empty>
        ) : (
          <>
            <Card className={s.who}>
              <Avatar name={m.name} className={s.avatar} />
              <span className={s.name}>{m.name}</span>
              <span className="row-s">{t.relations[m.relation]}{m.born ? `, ${t.bornIn(m.born)}` : ''}</span>
              <span className={s.consent}><Icon name="shield" size={14} />{t.managingUntil(fd(m.consentUntil))}</span>
            </Card>
            {m.pension && (
              <>
                <h2 className="h">{t.pensionTitle}</h2>
                <Card>
                  <KeyValue items={[
                    [t.pensionMonthly, inr(m.pension.monthly)],
                    [t.ppo, <span className="mono">{m.pension.ppo}</span>],
                    [t.lifeCertificate, m.pension.lcDone ? <Pill tone="ok">{fd(m.pension.lcDone)}</Pill> : <Pill tone="warn">{fd(m.pension.lcDue)}</Pill>],
                  ]} />
                  <p className="note">{m.pension.lcDone ? t.lcDone(fd(m.pension.lcDone)) : t.lcDue(fd(m.pension.lcDue))}</p>
                  {!m.pension.lcDone && <Button variant="primary" block onClick={() => sheet.open(<LifeCertificateSheet m={m} />)}>{t.submitLc}</Button>}
                </Card>
              </>
            )}
            {m.abha && (
              <>
                <h2 className="h">{t.healthId}</h2>
                <Card variant="rows"><Row icon={<RowIcon icon="heart" svc="health" />} title={t.healthId} sub={<span className="mono">{m.abha}</span>} /></Card>
              </>
            )}
            {!m.pension && !m.abha && <p className="note">{t.noFamilyRecords}</p>}
            <Button danger block onClick={stop}>{t.stopManaging}</Button>
          </>
        )}
      </main>
    </>
  );
}

/** The yearly life certificate: a face check with Aadhaar on this phone, as Jeevan Pramaan does, then the pension continues. */
function LifeCertificateSheet({ m }: { m: FamilyMember }) {
  const t = useT();
  const sheet = useSheet();
  const act = useActions();
  const [phase, setPhase] = useState<'ready' | 'checking' | 'done'>('ready');
  const start = async () => {
    setPhase('checking');
    await act.submitLifeCertificate(m.id);
    setPhase('done');
  };
  return (
    <>
      <div className={s.lcMark} data-phase={phase} aria-hidden="true"><Icon name={phase === 'done' ? 'check' : 'face'} size={40} /></div>
      <SheetTitle>{phase === 'done' ? t.lcSubmitted : t.lcTitle}</SheetTitle>
      <p className="row-s" aria-live="polite">{phase === 'done' ? t.lcSubmittedBody(first(m.name)) : phase === 'checking' ? t.lcChecking : t.lcBody(first(m.name))}</p>
      {phase === 'done' ? (
        <Button variant="primary" block onClick={sheet.close}>{t.done}</Button>
      ) : (
        <Button variant="primary" block disabled={phase === 'checking'} onClick={start}>{t.faceStart}</Button>
      )}
    </>
  );
}

const RELATIONS: Relation[] = ['father', 'mother', 'spouse', 'son', 'daughter', 'other'];

/** Add someone: their details, then the OTP sent to their own phone, which is how they consent. */
export function AddFamilySheet() {
  const t = useT();
  const sheet = useSheet();
  const toast = useToast();
  const act = useActions();
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<Relation>('mother');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const next = async (e: FormEvent) => {
    e.preventDefault();
    const m = mobile.replace(/\D/g, '');
    if (!name.trim()) return setErr(t.errName);
    if (!/^[6-9]\d{9}$/.test(m)) return setErr(t.errMobile);
    setBusy(true);
    await api.auth.sendOtp(m);
    setBusy(false);
    setMobile(m);
    setErr('');
    setStep('otp');
  };
  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.auth.verifyOtp(mobile, otp.trim());
      await act.addFamily({ name: name.trim(), relation, mobile });
      sheet.close();
      toast(t.familyAdded(name.trim()));
    } catch (x) {
      if (x instanceof InvalidOtp) setErr(t.errOtp);
      else throw x;
    } finally {
      setBusy(false);
    }
  };

  return step === 'details' ? (
    <form onSubmit={next} noValidate>
      <SheetTitle>{t.addFamily}</SheetTitle>
      <p className="row-s">{t.addFamilySub}</p>
      <Field label={t.theirName}><input autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Select<Relation> field label={t.relation} value={relation} onChange={setRelation} options={RELATIONS.map((r) => [r, t.relations[r]] as const)} />
      <Field label={t.theirMobile}><input inputMode="numeric" maxLength={10} placeholder={t.mobilePlaceholder} value={mobile} onChange={(e) => setMobile(e.target.value)} /></Field>
      <div className="err" role="alert">{err}</div>
      <Button type="submit" variant="primary" block disabled={busy}>{t.getOtp}</Button>
    </form>
  ) : (
    <form onSubmit={confirm} noValidate>
      <SheetTitle>{t.familyConsentTitle}</SheetTitle>
      <p className="row-s">{t.familyConsentBody(mobile)}</p>
      <Field label={t.otpLabel}><input inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value)} /></Field>
      <div className="err" role="alert">{err}</div>
      <Button type="submit" variant="primary" block disabled={busy}>{t.verify}</Button>
    </form>
  );
}
