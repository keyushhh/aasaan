import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Field } from '../../components/Field';
import { api, setLinks } from '../../data';
import { DEPTS, type Dept } from '../../data/types';
import { en } from '../../i18n/strings';
import { InvalidOtp } from '../../data/services';
import { setSession, useT } from '../../app/session';
import { useNav } from '../../app/nav';
import s from './Login.module.css';

type Step = 'mobile' | 'otp' | 'link';

export function Login() {
  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  if (step === 'mobile') return <MobileStep onDone={(m) => { setMobile(m); setStep('otp'); }} />;
  if (step === 'otp') return <OtpStep mobile={mobile} onDone={() => setStep('link')} onChange={() => setStep('mobile')} />;
  return <LinkStep mobile={mobile} />;
}

function useFocusOnMount() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const id = setTimeout(() => ref.current?.focus(), 50);
    return () => clearTimeout(id);
  }, []);
  return ref;
}

const Logo = () => <span className="logo" aria-hidden="true">आ</span>;

function MobileStep({ onDone }: { onDone: (m: string) => void }) {
  const t = useT();
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const ref = useFocusOnMount();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const m = v.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(m)) return setErr(t.errMobile);
    await api.auth.sendOtp(m);
    onDone(m);
  };
  return (
    <form className={s.login} onSubmit={submit} noValidate>
      <Logo />
      <h1>{t.signInTitle}</h1>
      <p className="row-s">{t.signInBody}</p>
      <Field label={t.mobileLabel}>
        <input ref={ref} inputMode="numeric" maxLength={10} placeholder={t.mobilePlaceholder} autoComplete="tel-national" value={v} onChange={(e) => setV(e.target.value)} />
      </Field>
      <div className="err" role="alert">{err}</div>
      <Button type="submit" variant="primary" block trail="chev">{t.getOtp}</Button>
      <p className={s.proto}>{t.protoLogin}</p>
    </form>
  );
}

function OtpStep({ mobile, onDone, onChange }: { mobile: string; onDone: () => void; onChange: () => void }) {
  const t = useT();
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const ref = useFocusOnMount();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const { name } = await api.auth.verifyOtp(mobile, v);
      setSession({ name });
      onDone();
    } catch (x) {
      if (x instanceof InvalidOtp) setErr(t.errOtp);
      else throw x;
    }
  };
  return (
    <form className={s.login} onSubmit={submit} noValidate>
      <Logo />
      <h1>{t.otpTitle}</h1>
      <p className="row-s">{t.sentTo(mobile)}</p>
      <Field label={t.otpLabel}>
        <input ref={ref} inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={v} onChange={(e) => setV(e.target.value)} />
      </Field>
      <span className={s.hint}>{t.demoOtp}</span>
      <div className="err" role="alert">{err}</div>
      <Button type="submit" variant="primary" block trail="chev">{t.verify}</Button>
      <Button block onClick={onChange}>{t.changeNumber}</Button>
    </form>
  );
}

function LinkStep({ mobile }: { mobile: string }) {
  const t = useT();
  const nav = useNav();
  const [picked, setPicked] = useState<Record<Dept, boolean>>({ epf: true, docs: true, vehicle: true, tax: true, health: true });
  const finish = () => {
    setLinks(picked);
    setSession({ mobile, loggedIn: true });
    nav.home();
  };
  return (
    <div className={s.login}>
      <h1>{t.linkAccounts}</h1>
      <p className="row-s">{t.linkAccountsBody}</p>
      <Card variant="list" className={s.consents}>
        {DEPTS.map((d) => (
          <label key={d} className={s.check}>
            <input type="checkbox" checked={picked[d]} onChange={(e) => setPicked((p) => ({ ...p, [d]: e.target.checked }))} />
            <span className={s.body}><span className="row-t">{en.svc[d]}</span><span className="row-s">{t.dept[d]}</span></span>
          </label>
        ))}
      </Card>
      <Button variant="primary" block trail="chev" onClick={finish}>{t.linkContinue}</Button>
    </div>
  );
}
