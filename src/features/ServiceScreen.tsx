import { useState, type ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
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
import s from './ServiceScreen.module.css';

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
        end={linked[svc] && <IconButton icon="refresh" size={19} label={t.refreshFrom(dept)} spin={spinning} onClick={refresh} />}
      />
      <main className="pad" id="main">{body}</main>
    </>
  );
}
