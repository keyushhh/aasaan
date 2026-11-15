import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Avatar, toAvatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Choice } from '../../components/Choice';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { Pill } from '../../components/Pill';
import { Row, RowIcon } from '../../components/Row';
import { SheetTitle, useSheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { api } from '../../data';
import { InvalidOtp } from '../../data/services';
import { MOBILE_TARGETS, targetDept, type Contact, type MobileTarget } from '../../data/types';
import { useAccessLog, useActions, useDepartments, useDevices } from '../../data/hooks';
import { ago } from '../../lib/format';
import { bioAvailable, enrollBio } from '../../lib/biometric';
import { SVC_ICON } from '../../app/nav';
import { setSession, useSession, useT } from '../../app/session';
import s from './Profile.module.css';

export const maskMobile = (m: string) => (m ? m.slice(0, 2) + '••••••' + m.slice(-2) : '98••••••21');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Name and photo. Nothing changes until Save changes. Email has its own flow, since it goes to every department. */
export function EditProfileSheet() {
  const t = useT();
  const sheet = useSheet();
  const toast = useToast();
  const session = useSession();
  const [name, setName] = useState(session.name);
  const [photo, setPhoto] = useState(session.photo);
  const [error, setError] = useState('');
  const file = useRef<HTMLInputElement>(null);

  const pick = async (f?: File) => {
    if (!f) return;
    try {
      setPhoto(await toAvatar(f));
      setError('');
    } catch {
      setError(t.errPhoto);
    }
  };
  const save = (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return setError(t.errName);
    setSession({ name: n, photo });
    sheet.close();
    toast(t.profileSaved);
  };

  return (
    <form onSubmit={save} noValidate>
      <SheetTitle>{t.editProfile}</SheetTitle>
      <div className={s.photoBlock}>
        <button type="button" className={s.photoBtn} aria-label={photo ? t.changePhoto : t.addPhoto} onClick={() => file.current?.click()}>
          <Avatar name={name || session.name} photo={photo} className={s.photo} />
          <span className={s.cam} aria-hidden="true"><Icon name="camera" size={16} /></span>
        </button>
        <div className={s.photoLinks}>
          <button type="button" className={s.link} onClick={() => file.current?.click()}>{photo ? t.changePhoto : t.addPhoto}</button>
          {photo && <button type="button" className={`${s.link} ${s.linkQuiet}`} onClick={() => setPhoto(undefined)}>{t.removePhoto}</button>}
        </div>
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      <Field label={t.fullName}>
        <input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="err" role="alert">{error}</div>
      <div className="btn-row">
        <Button onClick={sheet.close}>{t.cancel}</Button>
        <Button type="submit" variant="primary">{t.saveChanges}</Button>
      </div>
    </form>
  );
}

type Step = 'value' | 'otp' | 'where' | 'done';
type Result = { target: MobileTarget; queued: boolean };

/**
 * Change the mobile number or email once and send it to every chosen department together.
 * The new value, then the OTP sent to it, then where it should go, then where each one stands.
 * A department that is down keeps its update in the outbox and receives it when it is back.
 */
export function ContactSheet({ kind }: { kind: Contact }) {
  const t = useT();
  const sheet = useSheet();
  const toast = useToast();
  const act = useActions();
  const session = useSession();
  const { linked } = useDepartments();
  const mobile = kind === 'mobile';
  const current = (mobile ? session.mobile : session.email) ?? '';
  const [step, setStep] = useState<Step>('value');
  const [value, setValue] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<MobileTarget[]>(() => MOBILE_TARGETS.filter((x) => linked[targetDept(x)]));
  const [results, setResults] = useState<Result[]>([]);
  const name = (x: MobileTarget) => (x === 'aadhaar' ? t.aadhaar : t.dept[x]);
  const mark = (x: MobileTarget) => <RowIcon icon={x === 'aadhaar' ? 'shield' : SVC_ICON[x]} svc={targetDept(x)} logo={x} />;
  const shown = mobile ? `+91 ${value}` : value;

  const sendOtp = async (e: FormEvent) => {
    e.preventDefault();
    const v = mobile ? value.replace(/\D/g, '') : value.trim().toLowerCase();
    if (mobile ? !/^[6-9]\d{9}$/.test(v) : !EMAIL.test(v)) return setError(mobile ? t.errMobile : t.errEmailNeeded);
    if (v === current.toLowerCase()) return setError(mobile ? t.errSameMobile : t.errSameEmail);
    setBusy(true);
    await api.auth.sendOtp(v);
    setBusy(false);
    setValue(v);
    setError('');
    setStep('otp');
  };
  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.auth.verifyOtp(value, otp.trim());
      setError('');
      setStep('where');
    } catch (x) {
      if (x instanceof InvalidOtp) setError(t.errOtp);
      else throw x;
    } finally {
      setBusy(false);
    }
  };
  const update = async () => {
    setBusy(true);
    const out = await act.updateContact(kind, MOBILE_TARGETS.filter((x) => picked.includes(x)), value);
    setSession(mobile ? { mobile: value } : { email: value });
    setResults(out);
    setBusy(false);
    setStep('done');
    toast(mobile ? t.mobileToast : t.emailToast);
  };
  const toggle = (x: MobileTarget) => setPicked((p) => (p.includes(x) ? p.filter((y) => y !== x) : [...p, x]));

  if (step === 'value' || step === 'otp') {
    const first = step === 'value';
    return (
      <form onSubmit={first ? sendOtp : verify} noValidate>
        <SheetTitle>{mobile ? t.changeMobile : t.changeEmail}</SheetTitle>
        <p className="row-s">{first ? (mobile ? t.changeMobileIntro : t.changeEmailIntro) : mobile ? t.otpSentTo(value) : t.otpSentToEmail(value)}</p>
        {first ? (
          <Field label={mobile ? t.newMobile : t.newEmail}>
            {mobile ? (
              <input inputMode="numeric" maxLength={10} autoComplete="tel-national" placeholder={t.mobilePlaceholder} value={value} onChange={(e) => setValue(e.target.value)} />
            ) : (
              <input type="email" inputMode="email" autoComplete="email" placeholder={t.emailPlaceholder} value={value} onChange={(e) => setValue(e.target.value)} />
            )}
          </Field>
        ) : (
          <Field label={t.otpLabel}>
            <input inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value)} />
          </Field>
        )}
        <div className="err" role="alert">{error}</div>
        <Button type="submit" variant="primary" block disabled={busy}>{first ? t.getOtp : t.verify}</Button>
      </form>
    );
  }

  if (step === 'where') {
    return (
      <>
        <SheetTitle>{t.updateWhere}</SheetTitle>
        <p className="row-s">{mobile ? t.updateWhereBody : t.updateWhereEmailBody}</p>
        <Card variant="list" className={s.langs}>
          {MOBILE_TARGETS.map((x) => {
            const on = linked[targetDept(x)];
            return <Choice key={x} type="checkbox" checked={on && picked.includes(x)} disabled={!on} onChange={() => toggle(x)} icon={mark(x)} title={name(x)} sub={on ? t.targetWhat[x] : t.notLinked} />;
          })}
        </Card>
        {picked.includes('aadhaar') && <p className="note">{t.aadhaarNote}</p>}
        <div className={s.foot}>
          <Button variant="primary" disabled={busy || picked.length === 0} onClick={update}>{busy ? t.updating : t.updateCount(picked.length)}</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SheetTitle>{mobile ? t.mobileDone : t.emailDone}</SheetTitle>
      <p className="row-s">{mobile ? t.mobileDoneBody(maskMobile(value)) : t.emailDoneBody(shown)}</p>
      <Card variant="rows" className={s.langs}>
        {results.map(({ target, queued }) => (
          <Row key={target} icon={mark(target)} title={name(target)} sub={queued ? t.savedUntilBack(name(target)) : undefined}
            right={queued ? <Pill tone="warn">{t.queued}</Pill> : <Pill tone="ok">{t.updatedHere}</Pill>} />
        ))}
      </Card>
      <Button variant="primary" block onClick={sheet.close}>{t.done}</Button>
    </>
  );
}

/** Every device signed in to this account, with a way to end all sessions but this one. */
export function DevicesSheet() {
  const t = useT();
  const toast = useToast();
  const act = useActions();
  const devices = useDevices().data ?? [];
  const others = devices.filter((d) => !d.current);
  return (
    <>
      <SheetTitle>{t.devicesTitle}</SheetTitle>
      <Card variant="rows" className={s.langs}>
        {devices.map((d) => (
          <Row key={d.id} icon={<RowIcon icon={d.current ? 'phone' : 'monitor'} />} title={d.current ? t.thisDevice : d.name}
            sub={`${d.detail}. ${d.current ? t.activeNow : t.activeAgo(ago(d.lastActive))}`} />
        ))}
      </Card>
      {others.length ? (
        <Button danger block onClick={async () => { await act.signOutOthers(); toast(t.signedOutOthers); }}>{t.signOutOthers}</Button>
      ) : (
        <p className="note">{t.onlyThisDevice}</p>
      )}
    </>
  );
}

/** Every read a department answered, newest first: what was shared, by whom, and when. */
export function AccessSheet() {
  const t = useT();
  const log = useAccessLog();
  return (
    <>
      <SheetTitle>{t.accessTitle}</SheetTitle>
      <p className="row-s">{t.accessIntro}</p>
      {log.length ? (
        <Card variant="rows" className={s.langs}>
          {log.map((a) => (
            <Row key={a.at + a.key + a.dept} icon={<RowIcon icon={SVC_ICON[a.dept]} svc={a.dept} />} title={t.accessWhat[`${a.dept}:${a.key}`] ?? a.key}
              sub={t.accessRow(t.dept[a.dept], ago(a.at))} />
          ))}
        </Card>
      ) : (
        <p className="note">{t.accessEmpty}</p>
      )}
    </>
  );
}

/** Turn fingerprint or face unlock on or off after onboarding. Where the phone has none, say so. */
export function BioSheet() {
  const t = useT();
  const sheet = useSheet();
  const toast = useToast();
  const { name, mobile, bio } = useSession();
  const [available, setAvailable] = useState<boolean>();
  const [err, setErr] = useState('');
  useEffect(() => void bioAvailable().then(setAvailable), []);
  const turnOn = async () => {
    setErr('');
    try {
      setSession({ bio: await enrollBio(name, mobile) });
      sheet.close();
      toast(t.bioOnToast);
    } catch {
      setErr(t.bioFailed);
    }
  };
  const turnOff = () => {
    setSession({ bio: undefined });
    sheet.close();
    toast(t.bioOffToast);
  };
  return (
    <>
      <SheetTitle>{t.bioTitle}</SheetTitle>
      <p className="row-s">{available === false && !bio ? t.bioUnavailable : t.bioBody}</p>
      <div className="err" role="alert">{err}</div>
      {bio ? (
        <Button danger block onClick={turnOff}>{t.bioOff}</Button>
      ) : (
        <Button variant="primary" block disabled={!available} onClick={turnOn}>{t.bioOn}</Button>
      )}
    </>
  );
}
