/**
 * Phone notifications through the browser. They show while Aasaan is running or in the background;
 * a web app can't wake itself on a schedule, so reminders that must arrive while it's closed need server push
 * (see docs/native.md).
 */
export const canNotify = () => typeof Notification !== 'undefined';

/** Ask once. Resolves true when notifications are allowed. */
export async function allowNotifications() {
  if (!canNotify()) return false;
  if (Notification.permission === 'default') await Notification.requestPermission();
  return Notification.permission === 'granted';
}

/** Show a notification; tapping it opens `url` in the app. Quietly does nothing when not allowed. */
export async function notify(title: string, body: string, url = '/#/home', tag?: string) {
  if (!canNotify() || Notification.permission !== 'granted') return;
  const opts = { body, tag, icon: '/icon-any-192.png', badge: '/icon-any-192.png', data: { url } };
  const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
  if (reg) await reg.showNotification(title, opts);
  else new Notification(title, opts);
}
