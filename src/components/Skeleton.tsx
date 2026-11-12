import { Card } from './Card';
import s from './Skeleton.module.css';

const Bar = ({ w, big }: { w: string; big?: boolean }) => <div className={big ? `${s.skel} ${s.big}` : s.skel} style={{ width: w }} />;

/** What a department screen shows while it fetches. */
export function Skeleton() {
  return (
    <div aria-busy="true">
      <Card variant="hero"><Bar w="35%" /><Bar w="65%" big /><Bar w="90%" /></Card>
      <Card className={s.list}><Bar w="80%" /><Bar w="60%" /><Bar w="70%" /></Card>
    </div>
  );
}
