/**
 * Writes docs/translations.csv: every UI string with its English and each translation side by side,
 * for native speakers to review. Text that takes values shows them as {name}. Run: npm run i18n:sheet
 */
import { rolldown } from 'rolldown';
import { writeFileSync } from 'node:fs';

const bundle = await rolldown({ input: 'src/i18n/strings.ts', platform: 'node', logLevel: 'silent' });
const { output } = await bundle.generate({ format: 'esm' });
const { dictionaries, LANGS } = await import('data:text/javascript;base64,' + Buffer.from(output[0].code).toString('base64'));
const codes = LANGS.map(([c]) => c);

/** A function becomes its text with each parameter shown as {name}; plural forms show their "many" form. */
const show = (v) => {
  if (typeof v !== 'function') return String(v);
  const names = (v.toString().match(/^\(?([^)=]*)\)?\s*=>/)?.[1] ?? '').split(',').map((x) => x.split(':')[0].trim()).filter(Boolean);
  return String(v(...names.map((n) => `{${n}}`)));
};
const rows = [];
const walk = (path, values) => {
  const first = values[0];
  if (first && typeof first === 'object' && !Array.isArray(first)) {
    for (const k of Object.keys(first)) walk(path ? `${path}.${k}` : k, values.map((v) => v?.[k]));
  } else if (Array.isArray(first)) {
    first.forEach((_, i) => walk(`${path}[${i}]`, values.map((v) => v?.[i])));
  } else rows.push([path, ...values.map(show)]);
};
walk('', codes.map((c) => dictionaries[c]));

const csv = (x) => `"${String(x).replace(/"/g, '""')}"`;
writeFileSync('docs/translations.csv', '﻿' + [['key', ...codes], ...rows].map((r) => r.map(csv).join(',')).join('\n') + '\n');
console.log(`docs/translations.csv: ${rows.length} strings in ${codes.length} languages`);
