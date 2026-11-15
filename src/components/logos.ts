/**
 * Department logos. An image in src/assets/logos named after a department (epf, docs, vehicle, tax, health),
 * as .svg, .png or .webp, replaces that department's line icon wherever its marker shows. With no file, the icon stays.
 */
const files = import.meta.glob<string>('../assets/logos/*.{svg,png,webp}', { eager: true, query: '?url', import: 'default' });
export const LOGO: Partial<Record<string, string>> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, path.lastIndexOf('.')), url]),
);
