import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '../../components/Avatar';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Choice } from '../../components/Choice';
import { Field } from '../../components/Field';
import { Icon, type IconName } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { PinPad } from '../../components/PinPad';
import { Row, RowIcon } from '../../components/Row';
import { useSheet } from '../../components/Sheet';
import { cx } from '../../components/cx';
import { api, setLinks } from '../../data';
import { DEPTS, type Dept } from '../../data/types';
import { SimMismatch, type Finding, type Identity, type Sim } from '../../data/services';
import { LANGS } from '../../i18n/strings';
import { bioAvailable, enrollBio, verifyBio } from '../../lib/biometric';
import { rnd } from '../../lib/format';
import { hashPin } from '../../lib/pin';
import { SVC_ICON, useNav } from '../../app/nav';
import { setSession, useSession, useT } from '../../app/session';
import { LanguageSheet } from '../profile/Profile';
import { maskMobile } from '../profile/sheets';
import s from './Login.module.css';

/**
 * Onboarding, in the order a citizen-services app has to earn trust:
 * the number, proof that its SIM is in this phone, what each department holds for it,
 * whose records those are, a face check against Aadhaar, consent for what to link,
 * a PIN for this phone and, if the phone offers it, fingerprint or face unlock. Then home.
 */
type Step = 'welcome' | 'mobile' | 'sim' | 'discover' | 'identity' | 'face' | 'link' | 'pin' | 'bio' | 'ready';
const NUMBERED: Step[] = ['mobile', 'sim', 'discover', 'identity', 'face', 'link', 'pin'];
const BACK: Partial<Record<Step, Step>> = { mobile: 'welcome', sim: 'mobile' };

export function Login() {
  const [step, setStep] = useState<Step>('welcome');
  const [mobile, setMobile] = useState('');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [who, setWho] = useState<Identity>();
  const [picked, setPicked] = useState<Dept[]>([]);
  const [pin, setPin] = useState('');
  const [bio, setBio] = useState<string>();
  const nav = useNav();

  const qc = useQueryClient();
  const finish = () => {
    // A new sign-in must never see records another account left in memory.
    qc.clear();
    setLinks(Object.fromEntries(DEPTS.map((d) => [d, picked.includes(d)])) as Record<Dept, boolean>);
    setSession({ mobile, name: who?.name, pin, bio, account: mobile, found: findings.filter((f) => f.found).map((f) => f.dept), setupHidden: false, loggedIn: true });
    nav.home();
  };

  let body: ReactNode;
  if (step === 'welcome') body = <Welcome onNext={() => setStep('mobile')} />;
  else if (step === 'mobile') body = <MobileStep initial={mobile} onDone={(m) => { setMobile(m); setStep('sim'); }} />;
  else if (step === 'sim') body = <SimStep mobile={mobile} onDone={() => setStep('discover')} />;
  else if (step === 'discover') body = <DiscoverStep mobile={mobile} onDone={(f) => { setFindings(f); setPicked(f.filter((x) => x.found).map((x) => x.dept)); setStep('identity'); }} />;
  else if (step === 'identity') body = <IdentityStep mobile={mobile} onDone={(w) => { setWho(w); setStep('face'); }} onRestart={() => setStep('mobile')} />;
  else if (step === 'face') body = <FaceStep mobile={mobile} onDone={() => setStep('link')} />;
  else if (step === 'link') body = <LinkStep findings={findings} picked={picked} setPicked={setPicked} onDone={() => setStep('pin')} />;
  else if (step === 'pin') body = <PinStep mobile={mobile} onDone={(h) => { setPin(h); setStep('bio'); }} />;
  else if (step === 'bio') body = <BioStep name={who?.name ?? ''} mobile={mobile} onDone={(id) => { setBio(id); setStep('ready'); }} />;
  else body = <ReadyStep name={who?.name ?? ''} linked={picked.length} bio={!!bio} onDone={finish} />;

  return <Frame step={step} onBack={BACK[step] && (() => setStep(BACK[step]!))}>{body}</Frame>;
}

/** The progress bar and back button around every numbered step. */
function Frame({ step, onBack, children }: { step: Step; onBack?: () => void; children: ReactNode }) {
  const t = useT();
  const i = NUMBERED.indexOf(step === 'bio' ? 'pin' : step);
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
        <Button variant="primary" block onClick={onNext}>{t.getStarted}</Button>
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
      <div className={s.end}>
        <Button type="submit" variant="primary" block>{t.continueCta}</Button>
      </div>
    </form>
  );
}

/**
 * Device binding by SMS: the phone sends one message from the chosen SIM, and the number is verified when it
 * arrives from that number. The message shows as a thread with ticks: sending, sent, delivered, then verified.
 * Picking the wrong SIM says so.
 */
function SimStep({ mobile, onDone }: { mobile: string; onDone: () => void }) {
  const t = useT();
  const [sim, setSim] = useState<1 | 2>(1);
  const [sims, setSims] = useState<Sim[]>([]);
  // Read the phone's SIMs and start on the one that holds the number entered.
  useEffect(() => {
    void api.auth.sims(mobile).then((list) => {
      setSims(list);
      const own = list.find((x) => x.number === mobile);
      if (own) setSim(own.slot);
    });
  }, [mobile]);
  const [at, setAt] = useState(-1);
  const [err, setErr] = useState('');
  const [token] = useState(() => 'AASAAN ' + rnd(4, 'ABCDEFGHJKLMNPQRSTUVWXYZ') + ' ' + rnd(4));
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const send = async () => {
    setErr('');
    setAt(0);
    timers.current = [window.setTimeout(() => setAt(1), 800), window.setTimeout(() => setAt(2), 1700)];
    try {
      await api.auth.verifySim(mobile, sim);
      timers.current.forEach(clearTimeout);
      setAt(3);
      timers.current = [window.setTimeout(onDone, 900)];
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
        <div className={s.thread} aria-live="polite">
          <div className={s.threadHead}><span className={s.threadIc}><Icon name="message" size={16} /></span>{t.smsTo}</div>
          <div className={s.bubble}><span className="mono">{token}</span></div>
          <div className={s.ticks} data-at={at}>
            {at === 3 ? <span className={s.verified}><Icon name="check" size={14} />{t.smsStatus[3]}</span> : (
              <>{t.smsFrom(sim)}, {t.smsStatus[at]}<span className={s.tickIc}>{at === 0 ? <Icon name="clock" size={13} /> : <><Icon name="check" size={13} />{at === 2 && <Icon name="check" size={13} />}</>}</span></>
            )}
          </div>
        </div>
      ) : (
        <>
          <h2 className={s.ask}>{t.simPick}</h2>
          <Card variant="list" role="radiogroup" aria-label={t.simPick}>
            {sims.map((x) => (
              <Choice key={x.slot} type="radio" name="sim" checked={sim === x.slot} onChange={() => setSim(x.slot)}
                icon={<RowIcon icon="phone" logo={`carrier-${x.carrier}`} />}
                title={`${t.simN(x.slot)}, ${x.name}`}
                sub={<><span className="mono">+91 {x.number.slice(0, 5)} {x.number.slice(5)}</span>{x.number === mobile && <span className={s.simMatch}>{t.simMatch}</span>}</>} />
            ))}
          </Card>
          {err && <Banner spacing="sheet" title={err} />}
        </>
      )}
      <div className={s.end}>
        <Button variant="primary" block disabled={sending || sims.length === 0} onClick={send}>{t.sendSms}</Button>
      </div>
    </div>
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
        <Button variant="primary" block disabled={!done} onClick={() => onDone(all as Finding[])}>{t.continueCta}</Button>
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
            <Button variant="primary" block disabled={!who} onClick={() => who && onDone(who)}>{t.itsMe}</Button>
            <button type="button" className={s.textBtn} onClick={() => setNotMe(true)}>{t.notMe}</button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * A face check against the Aadhaar photo, as UIDAI face authentication does. The live camera shows in a ring that fills
 * while the match runs. Without a camera the check still runs, just without the preview.
 */
function FaceStep({ mobile, onDone }: { mobile: string; onDone: () => void }) {
  const t = useT();
  const [phase, setPhase] = useState<'ready' | 'scanning' | 'matched'>('ready');
  const [noCamera, setNoCamera] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const stop = () => stream.current?.getTracks().forEach((k) => k.stop());
  useEffect(() => stop, []);

  const start = async () => {
    setPhase('scanning');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (video.current) video.current.srcObject = stream.current;
    } catch {
      setNoCamera(true);
    }
    await api.auth.faceMatch(mobile);
    stop();
    setPhase('matched');
  };

  return (
    <div>
      <h1>{t.faceTitle}</h1>
      <p className="row-s">{phase === 'scanning' ? t.faceHold : phase === 'matched' ? t.faceMatched : t.faceBody}</p>
      <div className={s.face} data-phase={phase}>
        <svg className={s.faceRing} viewBox="0 0 100 100" aria-hidden="true"><circle className={s.track} cx="50" cy="50" r="47" /><circle className={s.arc} cx="50" cy="50" r="47" pathLength="100" /></svg>
        <div className={s.faceWindow}>
          {phase === 'scanning' && !noCamera ? <video ref={video} autoPlay playsInline muted /> : <Icon name={phase === 'matched' ? 'check' : 'face'} size={56} />}
        </div>
      </div>
      {noCamera && phase !== 'ready' && <p className={s.faceNote}>{t.faceNoCamera}</p>}
      <div className={s.end}>
        {phase === 'matched' ? (
          <Button variant="primary" block onClick={onDone}>{t.continueCta}</Button>
        ) : (
          <Button variant="primary" block disabled={phase === 'scanning'} onClick={start}>{t.faceStart}</Button>
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
        <Button variant="primary" block disabled={picked.length === 0} onClick={onDone}>{t.linkContinue}</Button>
      </div>
    </div>
  );
}

/** Set the PIN on the keypad, then enter it again. A mismatch shakes the boxes and starts over. */
function PinStep({ mobile, onDone }: { mobile: string; onDone: (hash: string) => void }) {
  const t = useT();
  const [first, setFirst] = useState('');
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const confirming = first !== '';
  useEffect(() => {
    if (v.length < 4) return;
    const id = setTimeout(async () => {
      if (!confirming) return (setFirst(v), setV(''), setErr(''));
      if (v !== first) return (setFirst(''), setV(''), setErr(t.errPinMatch));
      onDone(await hashPin(v, mobile));
    }, 180);
    return () => clearTimeout(id);
  }, [v, first, confirming, mobile, onDone, t]);
  return (
    <div>
      <h1>{confirming ? t.pinAgain : t.pinTitle}</h1>
      <p className="row-s">{t.pinBody}</p>
      <div className="err" role="alert">{err}</div>
      <div className={s.end}>
        <PinPad value={v} onChange={(x) => { setV(x); setErr(''); }} error={!!err} label={t.pinDigits(v.length)} deleteLabel={t.deleteDigit} />
      </div>
    </div>
  );
}

/** Offer the phone's fingerprint or face unlock. Where the phone or browser has none, say so and move on. */
function BioStep({ name, mobile, onDone }: { name: string; mobile: string; onDone: (id?: string) => void }) {
  const t = useT();
  const [available, setAvailable] = useState<boolean>();
  const [err, setErr] = useState('');
  useEffect(() => void bioAvailable().then(setAvailable), []);
  const turnOn = async () => {
    setErr('');
    try {
      onDone(await enrollBio(name, mobile));
    } catch {
      setErr(t.bioFailed);
    }
  };
  return (
    <div>
      <div className={s.bioArt} aria-hidden="true">
        <span><Icon name="finger" size={36} /></span>
        <span><Icon name="face" size={36} /></span>
      </div>
      <h1>{t.bioTitle}</h1>
      <p className="row-s">{available === false ? t.bioUnavailable : t.bioBody}</p>
      <div className="err" role="alert">{err}</div>
      <div className={s.end}>
        {available === false ? (
          <Button variant="primary" block onClick={() => onDone()}>{t.continueCta}</Button>
        ) : (
          <>
            <Button variant="primary" block disabled={available === undefined} onClick={turnOn}>{t.bioOn}</Button>
            <button type="button" className={s.textBtn} onClick={() => onDone()}>{t.notNow}</button>
          </>
        )}
      </div>
    </div>
  );
}

function ReadyStep({ name, linked, bio, onDone }: { name: string; linked: number; bio: boolean; onDone: () => void }) {
  const t = useT();
  return (
    <div className={s.ready}>
      <span className={s.readyMark} aria-hidden="true"><Icon name="check" size={32} /></span>
      <h1>{t.readyTitle(name.split(' ')[0])}</h1>
      <ul className={s.points}>
        {[t.readyVerified, t.readyLinked(linked), t.readyPin, ...(bio ? [t.readyBio] : [])].map((p) => (
          <li key={p}><span className={cx(s.pointIc, s.ok)}><Icon name="check" size={16} /></span>{p}</li>
        ))}
      </ul>
      <div className={s.end}>
        <Button variant="primary" block onClick={onDone}>{t.goHome}</Button>
      </div>
    </div>
  );
}

/** Opening the app again asks for the PIN, or the fingerprint or face if that was turned on. Forgetting the PIN means signing in again. */
export function Lock({ onUnlock }: { onUnlock: () => void }) {
  const t = useT();
  const { name, photo, pin, mobile, bio } = useSession();
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const tryBio = async () => {
    if (!bio) return;
    try {
      await verifyBio(bio);
      onUnlock();
    } catch {
      setErr(t.bioFailed);
    }
  };
  useEffect(() => {
    if (v.length < 4) return;
    let live = true;
    void hashPin(v, mobile).then((h) => {
      if (!live) return;
      if (h === pin) onUnlock();
      else (setV(''), setErr(t.errPinWrong));
    });
    return () => void (live = false);
  }, [v, pin, mobile, onUnlock, t]);
  return (
    <div className={cx(s.login, s.lock)}>
      <Avatar name={name} photo={photo} className={s.whoAvatar} />
      <h1>{t.lockTitle(name.split(' ')[0])}</h1>
      <p className="row-s">{t.lockBody}</p>
      <div className="err" role="alert">{err}</div>
      <div className={s.end}>
        <PinPad value={v} onChange={(x) => { setV(x); setErr(''); }} error={!!err} label={t.pinDigits(v.length)} deleteLabel={t.deleteDigit}
          extra={bio && <button type="button" aria-label={t.useBio} onClick={tryBio}><Icon name="finger" size={28} /></button>} />
        <button type="button" className={s.textBtn} onClick={() => setSession({ loggedIn: false, pin: undefined, bio: undefined })}>{t.forgotPin}</button>
      </div>
    </div>
  );
}
