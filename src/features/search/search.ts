import type { Strings } from '../../i18n/strings';

/** Every word typed must appear in the action's label or keywords (English or Hindi). */
export function searchActions(q: string, actions: Strings['actions']) {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  return actions.filter(([label, , kw]) => {
    const hay = (label + ' ' + kw).toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
