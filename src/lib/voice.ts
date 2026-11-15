/**
 * Voice search through the browser's speech recognition, in the app's language (Hindi, Bengali, Marathi, Telugu, English).
 * Chrome and Safari have it; where a browser doesn't, the mic button simply isn't shown.
 */
type Recognition = { lang: string; interimResults: boolean; maxAlternatives: number; start(): void; abort(): void; onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
const Ctor = (): (new () => Recognition) | undefined =>
  (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition ??
  (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;

export const canListen = () => typeof window !== 'undefined' && !!Ctor();

/** Listen once. Calls onText with what was heard, onEnd when listening stops either way. Returns a stop function. */
export function listen(lang: string, onText: (text: string) => void, onEnd: (heard: boolean) => void) {
  const R = Ctor();
  if (!R) return () => {};
  const r = new R();
  let heard = false;
  r.lang = `${lang}-IN`;
  r.interimResults = false;
  r.maxAlternatives = 1;
  r.onresult = (e) => {
    heard = true;
    onText(e.results[0][0].transcript);
  };
  r.onerror = () => {};
  r.onend = () => onEnd(heard);
  r.start();
  return () => r.abort();
}
