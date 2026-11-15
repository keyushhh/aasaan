import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Avatar } from '../../components/Avatar';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Choice } from '../../components/Choice';
import { Field } from '../../components/Field';
import { Icon, type IconName } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { Row, RowIcon } from '../../components/Row';
import { useSheet } from '../../components/Sheet';
import { cx } from '../../components/cx';
import { api, setLinks } from '../../data';
import { DEPTS, type Dept } from '../../data/types';
import { InvalidOtp, SimMismatch, type Finding, type Identity } from '../../data/services';
import { LANGS } from '../../i18n/strings';
import { hashPin } from '../../lib/pin';
import { SVC_ICON, useNav } from '../../app/nav';
import { setSession, useSession, useT } from '../../app/session';
import { LanguageSheet } from '../profile/Profile';
import { maskMobile } from '../profile/sheets';
import s from './Login.module.css';

/**
 * Onboarding, in the order a citizen-services app has to earn trust:
 * the number, proof that its SIM is in this phone, what each department holds for it,
 * whose records those are, consent for what to link, a PIN for this phone, then home.
 */
type Step = 'welcome' | 'mobile' | 'sim' | 'otp' | 'discover' | 'identity' | 'link' | 'pin' | 'ready';
const NUMBERED: Step[] = ['mobile', 'sim', 'discover', 'identity', 'link', 'pin'];
const BACK: Partial<Record<Step, Step>> = { mobile: 'welcome', sim: 'mobile', otp: 'sim' };

export function Login() {
  const [step, setStep] = useState<Step>('welcome');
  const [mobile, setMobile] = useState('');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [who, setWho] = useState<Identity>();
  const [picked, setPicked] = useState<Dept[]>([]);
  const [pin, setPin] = useState('');
  const nav = useNav();

  const finish = () => {
    setLinks(Object.fromEntries(DEPTS.map((d) => [d, picked.includes(d)])) as Record<Dept, boolean>);
    setSession({ mobile, name: who?.name, pin, loggedIn: true });
    nav.home();
  };

  let body: ReactNode;
  if (step === 'welcome') body = <Welcome onNext={() => setStep('mobile')} />;
  else if (step === 'mobile') body = <MobileStep initial={mobile} onDone={(m) => { setMobile(m); setStep('sim'); }} />;
  else if (step === 'sim') body = <SimStep mobile={mobile} onDone={() => setStep('discover')} onOtp={() => setStep('otp')} />;
  else if (step === 'otp') body = <OtpStep mobile={mobile} onDone={() => setStep('discover')} onChange={() => setStep('mobile')} />;
  else if (step === 'discover') body = <DiscoverStep mobile={mobile} onDone={(f) => { setFindings(f); setPicked(f.filter((x) => x.found).map((x) => x.dept)); setStep('identity'); }} />;
  else if (step === 'identity') body = <IdentityStep mobile={mobile} onDone={(w) => { setWho(w); setStep('link'); }} onRestart={() => setStep('mobile')} />;
  else if (step === 'link') body = <LinkStep findings={findings} picked={picked} setPicked={setPicked} onDone={() => setStep('pin')} />;
  else if (step === 'pin') body = <PinStep mobile={mobile} onDone={(h) => { setPin(h); setStep('ready'); }} />;
  else body = <ReadyStep name={who?.name ?? ''} linked={picked.length} onDone={finish} />;

  return <Frame step={step} onBack={BACK[step] && (() => setStep(BACK[step]!))}>{body}</Frame>;
}

/** The progress bar and back button around every numbered step. */
function Frame({ step, onBack, children }: { step: Step; onBack?: () => void; children: ReactNode }) {
  const t = useT();
  const i = NUMBERED.indexOf(step === 'otp' ? 'sim' : step);
  return (
    <div className={s.login}>
      {i >= 0 && (
        <div className={s.top}>
          {onBack ? <IconButton icon="back" label={t.back} onClick={onBack} /> : <span className={s.topGap} />}
          <div className={s.bar} role="progressbar" aria-label={t.stepOf(i + 1, NUMBERED.length)} aria-valuemin={1} aria-valuemax={NUMBERED.length} aria-valuenow={i + 1}>
            {NUMBERED.map((_, k) => <span key={k} data-on={k <= i || undefined} />)}
          </div>
          <span className={s.count}>{t.stepOf(i + 1, NUMBERED.length)}</span>
        </div>
      )}
      {children}
    </div>
  );
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
const POINT_ICONS: IconName[] = ['search', 'shield', 'clock'];

function Welcome({ onNext }: { onNext: () => void }) {
  const t = useT();
  const sheet = useSheet();
  const { lang } = useSession();
  return (
    <div className={s.welcome}>
      <div className={s.welcomeTop}>
        <Logo />
        <button type="button" className={s.lang} onClick={() => sheet.open(<LanguageSheet />)}>
          <Icon name="globe" size={16} /><span lang={lang}>{LANGS.find(([k]) => k === lang)![1]}</span><Icon name="down" size={14} />
        </button>
      </div>
      <h1>{t.welcomeTitle}</h1>
      <p className="row-s">{t.welcomeBody}</p>
      <ul className={s.points}>
        {t.welcomePoints.map((p, i) => (
          <li key={i}><span className={s.pointIc}><Icon name={POINT_ICONS[i]} size={18} /></span>{p}</li>
        ))}
      </ul>
      <div className={s.end}>
        <Button variant="primary" block trail="chev" onClick={onNext}>{t.getStarted}</Button>
        <p className={s.proto}>{t.protoLogin}</p>
      </div>
    </div>
  );
}

function MobileStep({ initial, onDone }: { initial: string; onDone: (m: string) => void }) {
  const t = useT();
  const [v, setV] = useState(initial);
  const [err, setErr] = useState('');
  const ref = useFocusOnMount();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const m = v.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(m)) return setErr(t.errMobile);
    onDone(m);
  };
  return (
    <form onSubmit={submit} noValidate>
      <h1>{t.mobileTitle}</h1>
      <p className="row-s">{t.mobileBody}</p>
      <Field label={t.mobileLabel}>
        <input ref={ref} inputMode="numeric" maxLength={10} placeholder={t.mobilePlaceholder} autoComplete="tel-national" value={v} onChange={(e) => setV(e.target.value)} />
      </Field>
      <div className="err" role="alert">{err}</div>
      <Button type="submit" variant="primary" block trail="chev">{t.continueCta}</Button>
    </form>
  );
}

/** A spinner while a line is in progress, a tick once it is done, an empty ring before it starts. */
function Progress({ items, at }: { items: ReactNode[]; at: number }) {
  return (
    <ol className={s.progress}>
      {items.map((label, i) => (
        <li key={i} data-state={i < at ? 'done' : i === at ? 'now' : 'todo'}>
          <span className={s.dot} aria-hidden="true">{i < at && <Icon name="check" size={14} />}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}

/**
 * Device binding by SMS: the phone sends one message from the chosen SIM, and the number is verified when it
 * arrives from that number. Picking the wrong SIM says so; an OTP is always there as a fallback.
 */
function SimStep({ mobile, onDone, onOtp }: { mobile: string; onDone: () => void; onOtp: () => void }) {
  const t = useT();
  const [sim, setSim] = useState<1 | 2>(1);
  const [at, setAt] = useState(-1);
  const [err, setErr] = useState('');
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const send = async () => {
    setErr('');
    setAt(0);
    timers.current = [window.setTimeout(() => setAt(1), 700), window.setTimeout(() => setAt(2), 1500)];
    try {
      await api.auth.verifySim(mobile, sim);
      timers.current.forEach(clearTimeout);
      setAt(3);
      timers.current = [window.setTimeout(onDone, 700)];
    } catch (x) {
      timers.current.forEach(clearTimeout);
      setAt(-1);
      if (x instanceof SimMismatch) setErr(t.simMismatch(sim));
      else throw x;
    }
  };

  const sending = at >= 0;
  return (
    <div>
      <h1>{t.simTitle}</h1>
      <p className="row-s">{t.simBody(mobile)}</p>
      {sending ? (
        <Progress items={t.smsSteps} at={at} />
      ) : (
        <>
          <h2 className={s.ask}>{t.simPick}</h2>
          <Card variant="list" role="radiogroup" aria-label={t.simPick}>
            {([1, 2] as const).map((n) => (
              <Choice key={n} type="radio" name="sim" checked={sim === n} onChange={() => setSim(n)} icon={<RowIcon icon="phone" />} title={t.simN(n)} />
            ))}
          </Card>
          {err && <Banner spacing="sheet" title={err} />}
        </>
      )}
      <div className={s.end}>
        <Button variant="primary" block trail="chev" disabled={sending} onClick={send}>{t.sendSms}</Button>
        {!sending && <button type="button" className={s.textBtn} onClick={onOtp}>{t.useOtpInstead}</button>}
      </div>
    </div>
  );
}

/** The fallback when the SIM can't send an SMS: a one-time code to the number. */
function OtpStep({ mobile, onDone, onChange }: { mobile: string; onDone: () => void; onChange: () => void }) {
  const t = useT();
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const ref = useFocusOnMount();
  useEffect(() => void api.auth.sendOtp(mobile), [mobile]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.auth.verifyOtp(mobile, v);
      onDone();
    } catch (x) {
      if (x instanceof InvalidOtp) setErr(t.errOtp);
      else throw x;
    }
  };
  return (
    <form onSubmit={submit} noValidate>
      <h1>{t.otpTitle}</h1>
      <p className="row-s">{t.sentTo(mobile)}</p>
      <Field label={t.otpLabel}>
        <input ref={ref} inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={v} onChange={(e) => setV(e.target.value)} />
      </Field>
      <span className={s.hint}>{t.demoOtp}</span>
      <div className="err" role="alert">{err}</div>
      <div className={s.end}>
        <Button type="submit" variant="primary" block trail="chev">{t.verify}</Button>
        <button type="button" className={s.textBtn} onClick={onChange}>{t.changeNumber}</button>
      </div>
    </form>
  );
}

/** Ask every department at once; each row fills in when that department answers. */
function DiscoverStep({ mobile, onDone }: { mobile: string; onDone: (f: Finding[]) => void }) {
  const t = useT();
  const [found, setFound] = useState<Partial<Record<Dept, Finding>>>({});
  useEffect(() => {
    let live = true;
    DEPTS.forEach((d) => api.auth.discover(mobile, d).then(
      (f) => live && setFound((p) => ({ ...p, [d]: f })),
      () => live && setFound((p) => ({ ...p, [d]: { dept: d, found: false } })),
    ));
    return () => void (live = false);
  }, [mobile]);
  const all = DEPTS.map((d) => found[d]);
  const done = all.every(Boolean);
  const hits = all.filter((f) => f?.found).length;
  return (
    <div>
      <h1>{t.discoverTitle}</h1>
      <p className="row-s">{t.discoverBody(mobile)}</p>
      <Card variant="rows" aria-live="polite">
        {DEPTS.map((d) => {
          const f = found[d];
          return (
            <Row key={d} icon={<RowIcon icon={SVC_ICON[d]} svc={d} />} title={t.svc[d]}
              sub={!f ? t.looking : f.found ? <span className="mono">{f.id}</span> : t.nothingFound}
              right={<span className={cx(s.state, f && (f.found ? s.ok : s.none))} aria-hidden="true">{f && <Icon name={f.found ? 'check' : 'close'} size={14} />}</span>} />
          );
        })}
      </Card>
      {done && <p className={s.summary}>{t.foundIn(hits)}</p>}
      <div className={s.end}>
        <Button variant="primary" block trail="chev" disabled={!done} onClick={() => onDone(all as Finding[])}>{t.continueCta}</Button>
      </div>
    </div>
  );
}

/** Whose records these are, as Aadhaar has them, before anything is linked. */
function IdentityStep({ mobile, onDone, onRestart }: { mobile: string; onDone: (w: Identity) => void; onRestart: () => void }) {
  const t = useT();
  const [who, setWho] = useState<Identity>();
  const [notMe, setNotMe] = useState(false);
  useEffect(() => void api.auth.identity(mobile).then(setWho), [mobile]);
  return (
    <div>
      <h1>{t.identityTitle}</h1>
      <p className="row-s">{t.identityBody}</p>
      {who && (
        <Card className={s.who}>
          <Avatar name={who.name} className={s.whoAvatar} />
          <span className={s.whoName}>{who.name}</span>
          <span className="row-s">{t.bornIn(who.born)}, +91 {maskMobile(mobile)}</span>
          <span className={s.whoSource}><RowIcon icon="shield" logo="aadhaar" size={14} className={s.whoMark} />{t.identitySource}</span>
        </Card>
      )}
      {notMe && <Banner spacing="sheet" title={t.notMe}>{t.notMeBody}</Banner>}
      <div className={s.end}>
        {notMe ? (
          <Button variant="primary" block onClick={onRestart}>{t.changeNumber}</Button>
        ) : (
          <>
            <Button variant="primary" block trail="chev" disabled={!who} onClick={() => who && onDone(who)}>{t.itsMe}</Button>
            <button type="button" className={s.textBtn} onClick={() => setNotMe(true)}>{t.notMe}</button>
          </>
        )}
      </div>
    </div>
  );
}

function LinkStep({ findings, picked, setPicked, onDone }: { findings: Finding[]; picked: Dept[]; setPicked: (p: Dept[]) => void; onDone: () => void }) {
  const t = useT();
  const hits = findings.filter((f) => f.found);
  const toggle = (d: Dept) => setPicked(picked.includes(d) ? picked.filter((x) => x !== d) : [...picked, d]);
  return (
    <div>
      <h1>{t.linkAccounts}</h1>
      <p className="row-s">{t.linkAccountsBody}</p>
      <Card variant="list">
        {hits.map((f) => (
          <Choice key={f.dept} type="checkbox" checked={picked.includes(f.dept)} onChange={() => toggle(f.dept)}
            icon={<RowIcon icon={SVC_ICON[f.dept]} svc={f.dept} />} title={t.svc[f.dept]} sub={<span className="mono">{f.id}</span>} />
        ))}
      </Card>
      <div className={s.end}>
        <Button variant="primary" block trail="chev" disabled={picked.length === 0} onClick={onDone}>{t.linkContinue}</Button>
      </div>
    </div>
  );
}

function PinStep({ mobile, onDone }: { mobile: string; onDone: (hash: string) => void }) {
  const t = useT();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [err, setErr] = useState('');
  const ref = useFocusOnMount();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(a)) return setErr(t.errPin);
    if (a !== b) return setErr(t.errPinMatch);
    onDone(await hashPin(a, mobile));
  };
  return (
    <form onSubmit={submit} noValidate>
      <h1>{t.pinTitle}</h1>
      <p className="row-s">{t.pinBody}</p>
      <Field label={t.pinLabel}>
        <input ref={ref} type="password" inputMode="numeric" maxLength={4} autoComplete="new-password" className={s.pin} value={a} onChange={(e) => setA(e.target.value.replace(/\D/g, ''))} />
      </Field>
      <Field label={t.pinAgain}>
        <input type="password" inputMode="numeric" maxLength={4} autoComplete="new-password" className={s.pin} value={b} onChange={(e) => setB(e.target.value.replace(/\D/g, ''))} />
      </Field>
      <div className="err" role="alert">{err}</div>
      <div className={s.end}>
        <Button type="submit" variant="primary" block trail="chev">{t.setPin}</Button>
      </div>
    </form>
  );
}

function ReadyStep({ name, linked, onDone }: { name: string; linked: number; onDone: () => void }) {
  const t = useT();
  return (
    <div className={s.ready}>
      <span className={s.readyMark} aria-hidden="true"><Icon name="check" size={32} /></span>
      <h1>{t.readyTitle(name.split(' ')[0])}</h1>
      <ul className={s.points}>
        {[t.readyVerified, t.readyLinked(linked), t.readyPin].map((p) => (
          <li key={p}><span className={cx(s.pointIc, s.ok)}><Icon name="check" size={16} /></span>{p}</li>
        ))}
      </ul>
      <div className={s.end}>
        <Button variant="primary" block trail="chev" onClick={onDone}>{t.goHome}</Button>
      </div>
    </div>
  );
}

/** Opening the app again asks for the PIN set during onboarding. Forgetting it means signing in again. */
export function Lock({ onUnlock }: { onUnlock: () => void }) {
  const t = useT();
  const { name, photo, pin, mobile } = useSession();
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const ref = useFocusOnMount();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if ((await hashPin(v, mobile)) === pin) return onUnlock();
    setV('');
    setErr(t.errPinWrong);
  };
  return (
    <form className={cx(s.login, s.lock)} onSubmit={submit} noValidate>
      <Avatar name={name} photo={photo} className={s.whoAvatar} />
      <h1>{t.lockTitle(name.split(' ')[0])}</h1>
      <p className="row-s">{t.lockBody}</p>
      <Field label={t.pinLabel}>
        <input ref={ref} type="password" inputMode="numeric" maxLength={4} autoComplete="current-password" className={s.pin} value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, ''))} />
      </Field>
      <div className="err" role="alert">{err}</div>
      <div className={s.end}>
        <Button type="submit" variant="primary" block>{t.unlock}</Button>
        <button type="button" className={s.textBtn} onClick={() => setSession({ loggedIn: false, pin: undefined })}>{t.forgotPin}</button>
      </div>
    </form>
  );
}
