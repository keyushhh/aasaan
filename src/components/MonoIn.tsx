import type { ReactNode } from 'react';

/** Renders a dictionary line with one reference number set in mono, so copy stays in the dictionary. */
export function MonoIn({ line, part }: { line: string; part: string }): ReactNode {
  const i = line.indexOf(part);
  if (i < 0) return line;
  return <>{line.slice(0, i)}<span className="mono">{part}</span>{line.slice(i + part.length)}</>;
}
