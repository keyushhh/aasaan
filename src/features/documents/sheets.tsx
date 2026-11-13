import { useState } from 'react';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { KeyValue } from '../../components/KeyValue';
import { Segmented } from '../../components/Segmented';
import { SheetTitle, useSheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { DepartmentUnavailable, type Document, type Share } from '../../data';
import { useActions } from '../../data/hooks';
import { fd, fts } from '../../lib/format';
import { useT } from '../../app/session';
import s from './Documents.module.css';

export function DocSheet({ d }: { d: Document }) {
  const t = useT();
  const sheet = useSheet();
  const toast = useToast();
  return (
    <>
      <div className={s.doc}>
        <div className={s.iss}>{d.issuer}</div>
        <div className={s.name}>{d.name}</div>
        <div className={`${s.no} mono`}>{d.no}</div>
        <div className={s.ver}><Icon name="check" size={15} /> {t.verifiedFrom(fd(d.issued))}</div>
      </div>
      <KeyValue items={d.fields} />
      <div className="btn-row">
        <Button icon="download" onClick={() => toast(t.downloadToast)}>{t.download}</Button>
        <Button icon="share" variant="primary" onClick={() => sheet.open(<ShareSheet d={d} />)}>{t.share}</Button>
      </div>
    </>
  );
}

export function ShareSheet({ d }: { d: Document }) {
  const t = useT();
  const sheet = useSheet();
  const toast = useToast();
  const act = useActions();
  const [hours, setHours] = useState(24);
  const create = async () => {
    try {
      const share = await act.createShare(d.id, hours);
      sheet.set(<CodeSheet d={d} share={share} />);
    } catch (e) {
      if (e instanceof DepartmentUnavailable) toast(t.docsDown);
      else throw e;
    }
  };
  return (
    <>
      <SheetTitle>{t.shareTitle(d.name)}</SheetTitle>
      <p className="row-s">{t.shareBody}</p>
      <h2 className={`h ${s.expiryHead}`}>{t.codeWorksFor}</h2>
      <Segmented label={t.expiry} value={hours} onChange={setHours} options={t.expiryOptions.map(([value, label]) => ({ value, label }))} />
      <Button variant="primary" block trail="chev" onClick={create}>{t.createCode}</Button>
    </>
  );
}

function CodeSheet({ d, share }: { d: Document; share: Share }) {
  const t = useT();
  const sheet = useSheet();
  const toast = useToast();
  const copy = () => {
    try {
      navigator.clipboard.writeText(share.code).then(() => toast(t.copied), () => toast(t.copyFailed));
    } catch {
      toast(t.copyFailed);
    }
  };
  return (
    <>
      <SheetTitle>{t.codeReady}</SheetTitle>
      <p className="row-s">{t.codeReadyBody(d.name, fts(share.exp))}</p>
      <div className={`${s.code} mono`} aria-label={t.codeAria(share.code)}>{share.code}</div>
      <KeyValue items={[[t.shareDoc, d.name], [t.worksUntil, fts(share.exp)]]} />
      <div className="btn-row">
        <Button onClick={copy}>{t.copyCode}</Button>
        <Button variant="primary" onClick={sheet.close}>{t.done}</Button>
      </div>
    </>
  );
}
