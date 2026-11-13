import { Button } from '../../components/Button';
import { Empty } from '../../components/Empty';
import { Card } from '../../components/Card';
import { Row, RowIcon } from '../../components/Row';
import { useSheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { DepartmentUnavailable } from '../../data';
import { useActions, useDepartments, useDocuments, useShares } from '../../data/hooks';
import { fts } from '../../lib/format';
import { useT } from '../../app/session';
import { ServiceScreen } from '../ServiceScreen';
import { DocSheet } from './sheets';

export function Documents() {
  const t = useT();
  const sheet = useSheet();
  const toast = useToast();
  const act = useActions();
  const on = useDepartments().linked.docs;
  const docs = useDocuments(on), shares = useShares(on);

  const revoke = async (id: string) => {
    try {
      await act.revokeShare(id);
      toast(t.revoked);
    } catch (e) {
      if (e instanceof DepartmentUnavailable) toast(t.docsDown);
      else throw e;
    }
  };

  return (
    <ServiceScreen svc="docs" queries={[docs, shares]}>
      {() => {
        const active = shares.data!.filter((x) => x.exp > Date.now());
        const nameOf = (id: string) => docs.data!.find((d) => d.id === id)?.name ?? id;
        return (
          <>
            <Card variant="list">
              {docs.data!.map((d) => (
                <Row key={d.id} icon={<RowIcon icon="folder" />} title={d.name} sub={d.issuer} chevron onClick={() => sheet.open(<DocSheet d={d} />)} />
              ))}
            </Card>
            <h2 className="h">{t.activeCodes}</h2>
            {active.length ? (
              <Card variant="rows">
                {active.map((x) => (
                  <Row key={x.id} title={t.codeRow(nameOf(x.doc), x.code)} sub={t.expires(fts(x.exp))}
                    right={<Button small danger onClick={() => revoke(x.id)}>{t.revoke}</Button>} />
                ))}
              </Card>
            ) : (
              <Empty icon="share">{t.noCodes}</Empty>
            )}
          </>
        );
      }}
    </ServiceScreen>
  );
}
