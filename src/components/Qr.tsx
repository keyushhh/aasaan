import { useMemo } from 'react';
import { encode } from 'uqr';
import s from './Qr.module.css';

/** A QR code for a short text, drawn as one SVG path. Always dark on a light plate so any scanner reads it, in either theme. */
export function Qr({ text, label }: { text: string; label: string }) {
  const { size, d } = useMemo(() => {
    const { size, data } = encode(text, { border: 2 });
    let d = '';
    data.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x} ${y}h1v1h-1z`; }));
    return { size, d };
  }, [text]);
  return (
    <svg className={s.qr} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width={size} height={size} className={s.plate} />
      <path d={d} className={s.ink} />
    </svg>
  );
}
