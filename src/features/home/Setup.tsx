import { Card } from '../../components/Card';
import { Icon, type IconName } from '../../components/Icon';
import { useSheet } from '../../components/Sheet';
import { useFamily } from '../../data/hooks';
import { setSession, useSession, useT } from '../../app/session';
import { AddFamilySheet } from '../family/Member';
import { BioSheet, ContactSheet, EditProfileSheet } from '../profile/sheets';
import s from './Home.module.css';

interface Item { key: string; icon: IconName; label: string; done: boolean; open: () => void }

/**
 * First-run checklist on Home: the few things that make Aasaan more useful, each ticked off on its own once done.
 * Goes away when everything is done, or when the person hides it.
 */
export function Setup({ hasDates }: { hasDates: boolean }) {
  const t = useT();
  const sheet = useSheet();
  const { bio, email, photo, reminders = [], setupHidden } = useSession();
  const family = useFamily().data ?? [];
  const items: Item[] = [
    { key: 'bio', icon: 'finger', label: t.setupBio, done: !!bio, open: () => sheet.open(<BioSheet />) },
    { key: 'email', icon: 'mail', label: t.setupEmail, done: !!email, open: () => sheet.open(<ContactSheet kind="email" />) },
    { key: 'photo', icon: 'camera', label: t.setupPhoto, done: !!photo, open: () => sheet.open(<EditProfileSheet />) },
    ...(hasDates ? [{ key: 'reminder', icon: 'clock' as IconName, label: t.setupReminder, done: reminders.length > 0, open: () => document.getElementById('dates-h')?.scrollIntoView({ block: 'start' }) }] : []),
    { key: 'family', icon: 'user', label: t.setupFamily, done: family.length > 0, open: () => sheet.open(<AddFamilySheet />) },
  ];
  const done = items.filter((x) => x.done).length;
  if (setupHidden || done === items.length) return null;
  return (
    <section className={s.setup} aria-labelledby="setup-h">
      <div className={s.setupHead}>
        <div>
          <h2 id="setup-h">{t.setupTitle}</h2>
          <span>{t.setupCount(done, items.length)}</span>
        </div>
        <button type="button" className={s.setupHide} onClick={() => setSession({ setupHidden: true })}>{t.setupHide}</button>
      </div>
      <div className={s.setupBar} aria-hidden="true"><span style={{ width: `${(done / items.length) * 100}%` }} /></div>
      <Card variant="list" className={s.list}>
        {items.map((x) => (
          <button key={x.key} type="button" className={s.setupItem} data-done={x.done || undefined} disabled={x.done} onClick={x.open}>
            <span className={s.setupIc}><Icon name={x.done ? 'check' : x.icon} size={18} /></span>
            <span className={s.setupLabel}>{x.label}</span>
            {!x.done && <Icon name="chev" size={18} />}
          </button>
        ))}
      </Card>
    </section>
  );
}
