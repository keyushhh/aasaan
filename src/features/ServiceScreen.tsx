import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { IconButton } from '../components/IconButton';
import { RowIcon } from '../components/Row';
import { Skeleton } from '../components/Skeleton';
import { TopBar } from '../components/TopBar';
import { useToast } from '../components/Toast';
import { DepartmentUnavailable, type Dept } from '../data';
import { useActions, useDepartments, useOpening } from '../data/hooks';
import { ago } from '../lib/format';
import { SVC_ICON, useNav } from '../app/nav';
import { useT } from '../app/session';
import { cx } from '../components/cx';
import s from './ServiceScreen.module.css';

const PULL_AT = 56, PULL_MAX = 88;

/** The frame every department screen shares: header, link prompt, outage banner, last-synced line and the opening skeleton. */
export function ServiceScreen({ svc, queries, children }: { svc: Dept; queries: UseQueryResult[]; children: () => ReactNode }) {
  const t = useT();
  const nav = useNav();
  const toast = useToast();
  const act = useActions();
  const { linked, down, sync } = useDepartments();
  const loading = useOpening(queries);
  const [spinning, setSpinning] = useState(false);
  const dept = t.dept[svc];

  const refresh = async () => {
    setSpinning(true);
    try {
      await act.refresh(svc);
      toast(t.updated(dept));
    } catch (e) {
      if (e instanceof DepartmentUnavailable) toast(t.stillDown(dept));
      else throw e;
    } finally {
      setSpinning(false);
    }
  };

  // Pull to refresh: drag down from the top of the page. The distance is damped and capped; past the threshold, letting go refreshes.
  const [pull, setPull] = useState(0);
  const drag = useRef<{ from: number | null; by: number }>({ from: null, by: 0 });
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useEffect(() => {
    if (!linked[svc]) return;
    const start = (e: TouchEvent) => {
      drag.current = { from: window.scrollY <= 0 && !document.querySelector('dialog[open]') ? e.touches[0].clientY : null, by: 0 };
    };
    const move = (e: TouchEvent) => {
      if (drag.current.from == null) return;
      drag.current.by = Math.min(Math.max(0, e.touches[0].clientY - drag.current.from) * 0.5, PULL_MAX);
      setPull(drag.current.by);
    };
    const end = () => {
      if (drag.current.from != null && drag.current.by >= PULL_AT) void refreshRef.current();
      drag.current = { from: null, by: 0 };
      setPull(0);
    };
    window.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
    return () => {
      window.removeEventListener('touchstart', start);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
      window.removeEventListener('touchcancel', end);
    };
  }, [linked, svc]);

  const link = () => {
    act.setLinked(svc, true);
    toast(t.linkedToast(dept));
  };

  let body: ReactNode;
  if (!linked[svc]) {
    body = (
      <Card>
        <RowIcon icon={SVC_ICON[svc]} svc={svc} size={22} className={s.linkIcon} />
        <div className="row-t">{t.linkTitle(dept)}</div>
        <p className="row-s">{t.linkBody}</p>
        <Button variant="primary" block trail="chev" onClick={link}>{t.linkCta(dept)}</Button>
      </Card>
    );
  } else if (loading) {
    body = <Skeleton />;
  } else {
    body = (
      <>
        {down[svc] && <Banner title={t.downBannerTitle(dept)}>{t.downBannerBody}</Banner>}
        <div className={`${s.sync} ${down[svc] ? s.down : ''}`}>{t.lastUpdated(ago(sync[svc]), dept)}</div>
        {queries.every((q) => q.data !== undefined) && children()}
      </>
    );
  }

  return (
    <>
      <TopBar
        title={t.svc[svc]}
        dept={dept}
        svc={svc}
        start={<IconButton icon="back" label={t.back} onClick={nav.back} />}
        end={linked[svc] && <span className={s.refreshBtn}><IconButton icon="refresh" size={19} label={t.refreshFrom(dept)} spin={spinning} onClick={refresh} /></span>}
      />
      {(pull > 0 || spinning) && (
        <div className={cx(s.pull, spinning && s.pulling)} style={{ height: spinning ? PULL_AT : pull }} aria-hidden="true">
          <span className={s.pullIc} style={{ transform: spinning ? undefined : `rotate(${pull * 4}deg)` }}><Icon name="refresh" size={18} /></span>
          {spinning ? t.refreshing : pull >= PULL_AT ? t.releaseToRefresh : t.pullToRefresh}
        </div>
      )}
      <main className="pad" id="main">{body}</main>
    </>
  );
}
