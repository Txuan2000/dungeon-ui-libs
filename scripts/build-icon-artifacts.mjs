#!/usr/bin/env node
// Build standalone icon artifacts from the DG_ICONS registry:
//   1. dg-icons.css       — mask-image classes (`.dgi .dgi-<name>`)
//   2. dg-icons-font.{ttf,woff,css} — webfont with `.dgf .dgf-<name>` (PUA \eXXX)
//
// Output: <dest>/icons/  (defaults to dist/dungeon-ui/icons/). Pass --dest=<dir>
// to override (used by `make icons-build`).
//
// Why two flavours: mask-image is the modern path (currentColor via
// background-color, no font file, no FOIT). The font ships as fallback for
// environments where mask-image's color trick is undesirable (legacy email
// clients, some PDF/print pipelines) or where users want the
// `<i class="dgf dgf-search">` ergonomics from PrimeIcons.

import { Readable } from 'node:stream';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import SVGIcons2SVGFontStream from 'svgicons2svgfont';
import svg2ttf from 'svg2ttf';
import ttf2woff from 'ttf2woff';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGISTRY = path.resolve(ROOT, 'projects/dungeon-ui/src/lib/icon/icons-data.ts');

const destArg = process.argv.find((a) => a.startsWith('--dest='));
const DEST = destArg ? path.resolve(destArg.slice('--dest='.length)) : path.resolve(ROOT, 'dist/dungeon-ui/icons');

// ---- Read registry ----------------------------------------------------------
// icons-data.ts is auto-generated and uses backtick template strings keyed by
// the icon name. Parse it instead of importing TS — keeps this script
// dependency-free of @angular/build.

function loadRegistry() {
  const src = fs.readFileSync(REGISTRY, 'utf8');
  // Match the DG_ICONS = { ... } block, then pull each `'name': \`body\``.
  const block = src.match(/DG_ICONS:\s*Record<DgIconName,\s*string>\s*=\s*\{([\s\S]*?)\n\};/);
  if (!block) throw new Error('Could not locate DG_ICONS block in ' + REGISTRY);
  const entries = [];
  const entryRe = /'([^']+)':\s*`([\s\S]*?)`\s*,/g;
  let m;
  while ((m = entryRe.exec(block[1])) !== null) {
    entries.push({ name: m[1], body: m[2] });
  }
  if (entries.length === 0) throw new Error('Parsed zero icons from registry');
  return entries;
}

const icons = loadRegistry();
fs.mkdirSync(DEST, { recursive: true });

// ---- Build 1: mask-image CSS ------------------------------------------------
// One data-URI per icon. encodeURIComponent is too aggressive (encodes safe
// chars like `/` and quotes data URIs need); use a narrower escape that
// matches what optipng/svgo emit.

function svgDataUri(body) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">${body}</svg>`;
  // Per https://codepen.io/tigt/post/optimizing-svgs-in-data-uris — encode
  // only the chars that break url() parsing (`<>"#?{}|^`%@`) plus whitespace.
  const encoded = svg
    .replace(/"/g, "'")
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/#/g, '%23')
    .replace(/\?/g, '%3F')
    .replace(/\s+/g, ' ')
    .trim();
  return `data:image/svg+xml,${encoded}`;
}

const cssLines = [
  '/* dungeon-ui icons — mask-image build.',
  ' *',
  ' * Each icon is exposed as a CSS class `.dgi-<name>`. Apply alongside the',
  ' * base `.dgi` class. Color follows `currentColor` via background-color, so',
  ' * the icon picks up the surrounding text color out of the box.',
  ' *',
  ' * Usage:',
  ' *   <i class="dgi dgi-check"></i>',
  ' *   <i class="dgi dgi-spinner dgi--spin"></i>',
  ' *',
  ' * To resize: set font-size on the parent (icons are 1em × 1em) or override',
  ' * width/height directly on the element.',
  ' */',
  '',
  '.dgi {',
  '  display: inline-block;',
  '  width: 1em;',
  '  height: 1em;',
  '  background-color: currentColor;',
  '  -webkit-mask-repeat: no-repeat;',
  '          mask-repeat: no-repeat;',
  '  -webkit-mask-position: center;',
  '          mask-position: center;',
  '  -webkit-mask-size: contain;',
  '          mask-size: contain;',
  '  vertical-align: -0.125em;',
  '  flex-shrink: 0;',
  '}',
  '',
  '.dgi--spin {',
  '  animation: dgi-spin 1s linear infinite;',
  '  transform-origin: center;',
  '}',
  '',
  '@keyframes dgi-spin {',
  '  from { transform: rotate(0deg); }',
  '  to   { transform: rotate(360deg); }',
  '}',
  '',
];

for (const { name, body } of icons) {
  const uri = svgDataUri(body);
  cssLines.push(`.dgi-${name} { -webkit-mask-image: url("${uri}"); mask-image: url("${uri}"); }`);
}

const cssPath = path.join(DEST, 'dg-icons.css');
fs.writeFileSync(cssPath, cssLines.join('\n') + '\n');

// Minified variant — strip comments + collapse whitespace; for CDN.
const minified = cssLines
  .filter((l) => !l.startsWith('/*') && !l.startsWith(' *') && !l.startsWith(' */'))
  .join('')
  .replace(/\s*\n\s*/g, '')
  .replace(/\s{2,}/g, ' ')
  .replace(/\s*([{}:;,])\s*/g, '$1');
fs.writeFileSync(path.join(DEST, 'dg-icons.min.css'), minified + '\n');

console.log(`✓ mask-image CSS  → ${path.relative(ROOT, cssPath)} (${icons.length} icons, ${(fs.statSync(cssPath).size / 1024).toFixed(1)} kB)`);

// ---- Build 2: webfont -------------------------------------------------------
// svgicons2svgfont consumes a stream of SVG file objects with a `metadata`
// field carrying the unicode codepoint(s). We assign sequential PUA code
// points starting at U+E001 (0xE000 is reserved by spec).

const FONT_NAME = 'dg-icons';
const PUA_START = 0xe001;
const UNITS_PER_EM = 1000;
const ASCENT = 850;
const DESCENT = -150;

const unicodeMap = icons.map(({ name }, i) => ({
  name,
  codepoint: PUA_START + i,
  char: String.fromCodePoint(PUA_START + i),
}));

function buildSvgFont() {
  return new Promise((resolve, reject) => {
    const fontStream = new SVGIcons2SVGFontStream({
      fontName: FONT_NAME,
      normalize: true,
      fontHeight: UNITS_PER_EM,
      // Center the 14×14 viewBox in the 1000-unit em.
      // svgicons2svgfont applies its own scaling; the input glyphs just need
      // to be valid SVG with consistent coordinates — it normalizes height.
      log: () => {}, // silence the default verbose logging
    });

    const chunks = [];
    fontStream.on('data', (c) => chunks.push(c));
    fontStream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    fontStream.on('error', reject);

    for (const { name, codepoint, char } of unicodeMap) {
      const body = icons.find((i) => i.name === name).body;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14">${body}</svg>`;
      const glyph = Readable.from([svg]);
      glyph.metadata = { name, unicode: [char] };
      void codepoint;
      fontStream.write(glyph);
    }
    fontStream.end();
  });
}

const svgFont = await buildSvgFont();
const ttf = Buffer.from(svg2ttf(svgFont, { description: 'dungeon-ui icon set', url: 'https://dungeon-ui.pages.dev' }).buffer);
const woff = Buffer.from(ttf2woff(ttf).buffer);

fs.writeFileSync(path.join(DEST, 'dg-icons.ttf'), ttf);
fs.writeFileSync(path.join(DEST, 'dg-icons.woff'), woff);

const fontCss = [
  '/* dungeon-ui icons — webfont build.',
  ' *',
  ' * Loads dg-icons.woff (modern) with dg-icons.ttf fallback. Glyphs occupy the',
  ' * Unicode Private Use Area starting at U+E001.',
  ' *',
  ' * Usage:',
  ' *   <i class="dgf dgf-check"></i>',
  ' *   <i class="dgf dgf-spinner dgf--spin"></i>',
  ' *',
  ' * Color follows `currentColor` (it is a font); resize via `font-size`.',
  ' */',
  '',
  '@font-face {',
  `  font-family: '${FONT_NAME}';`,
  `  src: url('./dg-icons.woff') format('woff'),`,
  `       url('./dg-icons.ttf')  format('truetype');`,
  '  font-weight: normal;',
  '  font-style: normal;',
  '  font-display: block;',
  '}',
  '',
  '.dgf {',
  `  font-family: '${FONT_NAME}' !important;`,
  '  font-style: normal;',
  '  font-weight: normal;',
  '  font-variant: normal;',
  '  text-transform: none;',
  '  line-height: 1;',
  '  display: inline-block;',
  '  speak: none;',
  '  -webkit-font-smoothing: antialiased;',
  '  -moz-osx-font-smoothing: grayscale;',
  '  vertical-align: -0.125em;',
  '}',
  '',
  '.dgf--spin {',
  '  animation: dgf-spin 1s linear infinite;',
  '  display: inline-block;',
  '  transform-origin: center;',
  '}',
  '',
  '@keyframes dgf-spin {',
  '  from { transform: rotate(0deg); }',
  '  to   { transform: rotate(360deg); }',
  '}',
  '',
];

for (const { name, codepoint } of unicodeMap) {
  fontCss.push(`.dgf-${name}::before { content: '\\${codepoint.toString(16)}'; }`);
}

const fontCssPath = path.join(DEST, 'dg-icons-font.css');
fs.writeFileSync(fontCssPath, fontCss.join('\n') + '\n');

console.log(`✓ webfont (TTF+WOFF) → ${path.relative(ROOT, path.join(DEST, 'dg-icons.{ttf,woff,css}'))}`);
console.log(`    TTF ${(ttf.length / 1024).toFixed(1)} kB · WOFF ${(woff.length / 1024).toFixed(1)} kB · CSS ${(fs.statSync(fontCssPath).size / 1024).toFixed(1)} kB`);

// ---- Manifest ---------------------------------------------------------------
// One JSON file documenting names + font codepoints, useful for generated
// tooling (storybook tables, design-tool plugins).

const manifest = {
  version: 1,
  generator: 'scripts/build-icon-artifacts.mjs',
  generatedAt: new Date().toISOString().slice(0, 10),
  iconCount: icons.length,
  viewBox: '0 0 14 14',
  cssClassMask: { base: 'dgi', perIcon: 'dgi-<name>', spin: 'dgi--spin' },
  cssClassFont: { base: 'dgf', perIcon: 'dgf-<name>', spin: 'dgf--spin' },
  font: { family: FONT_NAME, format: ['woff', 'truetype'], puaStart: '0x' + PUA_START.toString(16).toUpperCase() },
  icons: unicodeMap.map(({ name, codepoint }) => ({ name, codepoint: '0x' + codepoint.toString(16).toUpperCase() })),
};
fs.writeFileSync(path.join(DEST, 'dg-icons.manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`✓ manifest → ${path.relative(ROOT, path.join(DEST, 'dg-icons.manifest.json'))}`);
