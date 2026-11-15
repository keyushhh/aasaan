import { Banner } from '../../components/Banner';
import { SheetTitle } from '../../components/Sheet';
import type { Scheme } from '../../data/types';
import { useT } from '../../app/session';
import s from './Home.module.css';

/** One scheme: what it gives, why this person looks eligible, how to apply, and the official site. */
export function SchemeSheet({ scheme }: { scheme: Scheme }) {
  const t = useT();
  return (
    <>
      <SheetTitle>{scheme.name}</SheetTitle>
      <p className="row-s">{scheme.what}</p>
      <Banner icon="check" spacing="sheet" title={t.whyQualify}>{scheme.why}</Banner>
      <h3 className={s.stepsHead}>{t.howToApply}</h3>
      <ol className={s.steps}>{scheme.steps.map((x) => <li key={x}>{x}</li>)}</ol>
      <p className="note">{t.schemeNote}</p>
      <a className={s.site} href={scheme.site} target="_blank" rel="noopener noreferrer">{t.openSite}</a>
    </>
  );
}
