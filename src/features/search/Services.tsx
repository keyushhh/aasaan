import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Row } from '../../components/Row';
import { ServiceTile } from '../../components/ServiceTile';
import { TopBar } from '../../components/TopBar';
import { DEPTS } from '../../data/types';
import { useDepartments } from '../../data/hooks';
import { SVC_ICON, useNav } from '../../app/nav';
import { useSession, useT } from '../../app/session';
import { searchActions } from './search';
import { useToast } from '../../components/Toast';
import { canListen, listen } from '../../lib/voice';
import s from './Services.module.css';

export function Services() {
  const t = useT();
  const nav = useNav();
  const { linked } = useDepartments();
  const [q, setQ] = useState('');
  const field = useRef<HTMLInputElement>(null);
  const focus = (useLocation().state as { focus?: number } | null)?.focus;
  useEffect(() => { if (focus) field.current?.focus(); }, [focus]);
  const hits = searchActions(q, t.actions);
  const toast = useToast();
  const { lang } = useSession();
  const [listening, setListening] = useState(false);
  const stopVoice = useRef<() => void>(() => {});
  useEffect(() => () => stopVoice.current(), []);
  const voice = () => {
    if (listening) return stopVoice.current();
    setListening(true);
    stopVoice.current = listen(lang, (text) => setQ(text.replace(/[.।]$/, '')), (heard) => {
      setListening(false);
      if (!heard) toast(t.voiceFailed);
    });
  };
  return (
    <>
      <TopBar title={t.tabs.services} />
      <main className="pad" id="main">
        <label className={s.search}>
          <Icon name="search" size={20} />
          <input ref={field} type="search" placeholder={listening ? t.listening : t.search} autoComplete="off" aria-label={t.searchLabel} value={q} onChange={(e) => setQ(e.target.value)} />
          {canListen() && (
            <button type="button" className={s.mic} data-on={listening || undefined} aria-label={t.voiceSearch} aria-pressed={listening} onClick={voice}>
              <Icon name="mic" size={20} />
            </button>
          )}
        </label>
        {hits && (
          <Card variant="list" className={s.results}>
            {hits.length ? (
              hits.map(([label, route]) => (
                <Row key={label} title={label} sub={route === 'requests' ? t.requestsLabel : t.dept[route]} chevron onClick={() => nav.go(route)} />
              ))
            ) : (
              <Row><span className="row-s">{t.noMatch(q.trim())}</span></Row>
            )}
          </Card>
        )}
        <h2 className="h">{t.yourServices}</h2>
        <div className={s.grid}>
          {DEPTS.map((d) => (
            <ServiceTile key={d} svc={d} icon={SVC_ICON[d]} name={t.svc[d]} state={t.dept[d] + (linked[d] ? '' : t.notLinkedSuffix)} onClick={() => nav.go(d)} />
          ))}
        </div>
      </main>
    </>
  );
}
