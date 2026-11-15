import { useEffect } from 'react';
import { useDepartments, useLicence, useRegistration } from '../data/hooks';
import { deadlines } from '../features/home/deadlines';
import { notify } from '../lib/notify';
import { setSession, useSession, useT } from './session';

/** A reminder fires once, in the week before the date. */
const WINDOW = 7;

/**
 * Turned-on reminders become phone notifications in the week before each date: checked when the app opens
 * and every hour while it runs. Each fires once; the session remembers which ones have.
 */
export function useReminderNotices() {
  const t = useT();
  const { reminders = [], notified = [] } = useSession();
  const { linked } = useDepartments();
  const registration = useRegistration(linked.vehicle).data;
  const licence = useLicence(linked.vehicle).data;
  useEffect(() => {
    const check = () => {
      const due = deadlines({ registration, licence, tax: linked.tax }, t)
        .filter((d) => reminders.includes(d.key) && d.days <= WINDOW && !notified.includes(d.key));
      if (!due.length) return;
      due.forEach((d) => void notify(t.notifDue(d.title, d.days), t.notifDueBody, d.svc === 'tax' ? '/#/tax' : '/#/vehicle', d.key));
      setSession({ notified: [...notified, ...due.map((d) => d.key)] });
    };
    check();
    const id = setInterval(check, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [registration, licence, linked.tax, reminders, notified, t]);
}
