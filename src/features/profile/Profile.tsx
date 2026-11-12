import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Row, RowIcon } from '../../components/Row';
import { Segmented } from '../../components/Segmented';
import { Switch } from '../../components/Switch';
import { TopBar } from '../../components/TopBar';
import { useToast } from '../../components/Toast';
import { DEPTS, type Dept } from '../../data/types';
import { useActions, useDepartments } from '../../data/hooks';
import { en, type Lang } from '../../i18n/strings';
import { SVC_ICON, useNav } from '../../app/nav';
import { setSession, useSession, useT, type Theme } from '../../app/session';
import s from './Profile.module.css';

export function Profile() {
  const t = useT();
  const nav = useNav();
  const toast = useToast();
  const act = useActions();
  const { name, mobile, lang, theme = 'system' } = useSession();
  const { linked, down } = useDepartments();
  const masked = mobile ? mobile.slice(0, 2) + '••••••' + mobile.slice(-2) : '98••••••21';

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
          <span className="logo" aria-hidden="true">{name[0]}</span>
          <div><span className="row-t">{name}</span><span className="row-s">{t.verified(masked)}</span></div>
        </Card>
        <h2 className="h">{t.language}</h2>
        <Segmented<Lang> label={t.language} value={lang} onChange={(v) => setSession({ lang: v })}
          options={[{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिन्दी', lang: 'hi' }]} />
        <h2 className="h">{t.appearance}</h2>
        <Segmented<Theme> label={t.appearance} value={theme} onChange={(v) => setSession({ theme: v })}
          options={t.themes.map(([value, label]) => ({ value, label }))} />
        <h2 className="h">{t.linkedAccounts}</h2>
        <Card variant="list">
          {DEPTS.map((d) => (
            <Row key={d} icon={<RowIcon icon={SVC_ICON[d]} svc={d} />} title={t.svc[d]} sub={linked[d] ? t.linkedActive : t.notLinked}
              right={<Switch checked={linked[d]} label={t.linkSwitch(en.svc[d])} onChange={() => toggleLink(d)} />} />
          ))}
        </Card>
        <p className="note">{t.unlinkNote}</p>
        <h2 className="h">{t.protoControls}</h2>
        <Card variant="list">
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
