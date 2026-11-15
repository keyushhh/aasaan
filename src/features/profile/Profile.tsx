import { useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Card } from '../../components/Card';
import { Choice } from '../../components/Choice';
import { Row, RowIcon } from '../../components/Row';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { SheetTitle, useSheet } from '../../components/Sheet';
import { Switch } from '../../components/Switch';
import { TopBar } from '../../components/TopBar';
import { useToast } from '../../components/Toast';
import { DEPTS, type Dept } from '../../data/types';
import { useActions, useDepartments, useDevices, useFamily } from '../../data/hooks';
import { fd } from '../../lib/format';
import { AddFamilySheet } from '../family/Member';
import fs from '../family/Family.module.css';
import { en, LANGS } from '../../i18n/strings';
import { SVC_ICON, useNav } from '../../app/nav';
import { setSession, useSession, useT, type Theme } from '../../app/session';
import { AccessSheet, ContactSheet, DevicesSheet, EditProfileSheet, maskMobile } from './sheets';
import s from './Profile.module.css';

export function Profile() {
  const t = useT();
  const nav = useNav();
  const toast = useToast();
  const act = useActions();
  const sheet = useSheet();
  const { name, mobile, lang, theme = 'system', email, photo, bio } = useSession();
  const devices = useDevices().data?.length ?? 1;
  const family = useFamily().data ?? [];
  const { linked, down } = useDepartments();
  const masked = maskMobile(mobile);

  const toggleLink = (d: Dept) => {
    const on = !linked[d];
    act.setLinked(d, on);
    toast(on ? t.linkedToast(t.dept[d]) : t.unlinkedToast(t.dept[d]));
  };
  const toggleOutage = (d: Dept) => {
    const on = !down[d];
    act.setOutage(d, on); // recovery toasts come from the data layer's recovered event
    if (on) toast(t.simulating(t.dept[d]));
  };
  const reset = async () => {
    await act.reset();
    toast(t.resetToast);
    nav.home();
  };
  const logout = () => {
    setSession({ loggedIn: false });
    nav.home();
  };

  return (
    <>
      <TopBar title={t.tabs.profile} />
      <main className="pad" id="main">
        <Card className={s.me}>
          <Avatar name={name} photo={photo} />
          <div><span className="row-t">{name}</span><span className="row-s">{t.verified(masked)}</span>{email && <span className="row-s">{email}</span>}</div>
          <Button small icon="user" onClick={() => sheet.open(<EditProfileSheet />)}>{t.editProfile}</Button>
        </Card>
        <Card variant="rows" className={s.settings}>
          <Row icon={<RowIcon icon="phone" />} title={t.mobileNumber} sub={t.mobileRowSub(masked)} chevron onClick={() => sheet.open(<ContactSheet kind="mobile" />)} />
          <Row icon={<RowIcon icon="mail" />} title={t.email} sub={t.emailRowSub(email)} chevron onClick={() => sheet.open(<ContactSheet kind="email" />)} />
          <Row icon={<RowIcon icon="globe" />} title={t.language} sub={<span lang={lang}>{LANGS.find(([k]) => k === lang)![1]}</span>} chevron
            onClick={() => sheet.open(<LanguageSheet />)} />
          <Row icon={<RowIcon icon="contrast" />} title={t.appearance}
            right={<Select<Theme> label={t.appearance} value={theme} options={t.themes} onChange={(v) => setSession({ theme: v })} />} />
        </Card>
        <h2 className="h">{t.family}</h2>
        <Card variant="rows">
          {family.map((f) => (
            <Row key={f.id} icon={<Avatar name={f.name} className={fs.member} />} title={f.name} chevron onClick={() => nav.path(`/family/${f.id}`)}
              sub={f.pension && !f.pension.lcDone ? t.lcDue(fd(f.pension.lcDue)) : t.relations[f.relation]} />
          ))}
          <Row icon={<RowIcon icon="user" />} title={t.addFamily} sub={t.addFamilySub} chevron onClick={() => sheet.open(<AddFamilySheet />)} />
        </Card>
        <h2 className="h">{t.security}</h2>
        <Card variant="rows">
          <Row icon={<RowIcon icon="lock" />} title={t.appLock} sub={t.appLockSub(!!bio)} />
          <Row icon={<RowIcon icon="phone" />} title={t.devicesTitle} sub={t.devicesSub(devices)} chevron onClick={() => sheet.open(<DevicesSheet />)} />
          <Row icon={<RowIcon icon="eye" />} title={t.accessTitle} sub={t.accessSub} chevron onClick={() => sheet.open(<AccessSheet />)} />
        </Card>
        <h2 className="h">{t.linkedAccounts}</h2>
        <Card variant="rows">
          {DEPTS.map((d) => (
            <Row key={d} icon={<RowIcon icon={SVC_ICON[d]} svc={d} />} title={t.svc[d]} sub={linked[d] ? t.linkedActive : t.notLinked}
              right={<Switch checked={linked[d]} label={t.linkSwitch(en.svc[d])} onChange={() => toggleLink(d)} />} />
          ))}
        </Card>
        <p className="note">{t.unlinkNote}</p>
        <h2 className="h">{t.protoControls}</h2>
        <Card variant="rows">
          <Row><span className="row-s">{t.protoControlsIntro}</span></Row>
          {DEPTS.map((d) => (
            <Row key={d} title={t.simulate(t.dept[d])} right={<Switch warn checked={down[d]} label={t.simulate(t.dept[d])} onChange={() => toggleOutage(d)} />} />
          ))}
        </Card>
        <div className="btn-row">
          <Button onClick={reset}>{t.resetData}</Button>
          <Button danger onClick={logout}>{t.logOut}</Button>
        </div>
        <p className={s.proto}>{t.protoProfile}</p>
      </main>
    </>
  );
}

/**
 * Every language on offer as a radio list, each in its own script with its English name under it.
 * Picking one only marks it; Save changes applies it, Cancel leaves the language as it was.
 */
export function LanguageSheet() {
  const t = useT();
  const sheet = useSheet();
  const { lang } = useSession();
  const [pick, setPick] = useState(lang);
  return (
    <>
      <SheetTitle>{t.language}</SheetTitle>
      <Card variant="list" className={s.langs} role="radiogroup" aria-label={t.language}>
        {LANGS.map(([code, own, english]) => (
          <Choice key={code} type="radio" name="lang" checked={pick === code} onChange={() => setPick(code)} lang={code} title={own} sub={code === 'en' ? undefined : english} />
        ))}
      </Card>
      <div className={s.foot}>
        <Button onClick={sheet.close}>{t.cancel}</Button>
        <Button variant="primary" disabled={pick === lang} onClick={() => { setSession({ lang: pick }); sheet.close(); }}>{t.saveChanges}</Button>
      </div>
    </>
  );
}
