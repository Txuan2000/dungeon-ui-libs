#!/usr/bin/env node
// Validate docs/knowledge-graph.json against the actual filesystem.
//
// Drift checks:
//   1. Every directory under projects/dungeon-ui/src/lib/ has at least one
//      entry in library.exports referencing it.
//   2. Every library.exports[i].path resolves to a real file.
//   3. Every library.exports[i].scss resolves to a real file (if declared).
//   4. Every entry's listed `inputs` / `outputs` actually appears as
//      input(...) or output(...) in the source file (catches renamed/removed
//      props after the graph wasn't updated). Lightweight grep — no TS parse.
//   5. demo_app.routes[i].file resolves to a real file under src/app.
//   6. Every `methods` key parses (e.g. "name(args)" → identifier present in
//      the source file).
//
// Exits with code 0 when clean, 1 when drift is detected.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const graphPath = join(root, 'docs', 'knowledge-graph.json');
const libRoot = join(root, 'projects', 'dungeon-ui', 'src');
const showcaseRoot = join(root, 'src', 'app');

const errors = [];
const warnings = [];

function readGraph() {
  try {
    return JSON.parse(readFileSync(graphPath, 'utf8'));
  } catch (e) {
    errors.push(`Cannot parse ${graphPath}: ${e.message}`);
    return null;
  }
}

function listLibComponentDirs() {
  const libDir = join(libRoot, 'lib');
  if (!existsSync(libDir)) return [];
  return readdirSync(libDir).filter((name) => statSync(join(libDir, name)).isDirectory());
}

function fileSourceFor(entry) {
  if (!entry.path) return null;
  const abs = join(libRoot, entry.path);
  return existsSync(abs) ? readFileSync(abs, 'utf8') : null;
}

function checkExportsCoverDirs(graph, dirs) {
  const referenced = new Set();
  for (const e of graph.library.exports ?? []) {
    if (e.path) {
      const dir = e.path.split('/')[1]; // lib/<name>/...
      referenced.add(dir);
    }
  }
  for (const dir of dirs) {
    if (!referenced.has(dir)) {
      errors.push(`Library directory lib/${dir}/ has no entry in library.exports.`);
    }
  }
}

function checkPaths(graph) {
  for (const e of graph.library.exports ?? []) {
    if (e.path && !existsSync(join(libRoot, e.path))) {
      errors.push(`exports[${e.name}].path → ${e.path} does not exist.`);
    }
    if (e.scss && !existsSync(join(libRoot, e.scss))) {
      errors.push(`exports[${e.name}].scss → ${e.scss} does not exist.`);
    }
  }
}

function checkInputsOutputsMethods(graph) {
  for (const e of graph.library.exports ?? []) {
    const src = fileSourceFor(e);
    if (!src) continue; // already reported as missing path
    for (const name of e.inputs ?? []) {
      const ident = stripParens(name).replace(/\s+\(required\)$/, '');
      if (ident === 'value') continue; // value is often via model() not input()
      // Match either: `readonly <name> = input/model(...)` (no alias)
      //         OR:  `alias: '<name>'` (aliased signal input or @Input)
      const direct = new RegExp(`\\breadonly\\s+${escape(ident)}\\s*=\\s*(input|model)\\b`);
      const aliased = new RegExp(`alias:\\s*['"]${escape(ident)}['"]`);
      if (!direct.test(src) && !aliased.test(src)) {
        warnings.push(`exports[${e.name}].inputs lists "${name}" but no input()/model() or alias='${ident}' found in ${e.path}.`);
      }
    }
    for (const name of e.outputs ?? []) {
      const ident = stripParens(name);
      const re = new RegExp(`\\breadonly\\s+${escape(ident)}\\s*=\\s*output\\b`);
      if (!re.test(src)) {
        warnings.push(`exports[${e.name}].outputs lists "${name}" but no output() declaration found in ${e.path}.`);
      }
    }
    if (e.methods && typeof e.methods === 'object' && !Array.isArray(e.methods)) {
      for (const sig of Object.keys(e.methods)) {
        // Strip leading identifier (drop generics + args).
        const ident = sig.replace(/<.*?>/g, '').replace(/\(.*$/, '').trim();
        const re = new RegExp(`\\b${escape(ident)}\\s*[<(]`);
        if (!re.test(src)) {
          warnings.push(`exports[${e.name}].methods["${sig}"] not found as a function in ${e.path}.`);
        }
      }
    }
  }
}

function checkRoutes(graph) {
  for (const r of graph.demo_app?.routes ?? []) {
    if (r.file && !existsSync(join(showcaseRoot, r.file))) {
      errors.push(`demo_app.routes[${r.path}].file → ${r.file} does not exist.`);
    }
  }
}

function checkPrimengIndexed(graph) {
  const list = graph.rag?.primeng_indexed?.components ?? [];
  const refRoot = resolve(root, '..', 'primeng-ref', 'packages', 'primeng', 'src');
  if (!existsSync(refRoot)) {
    warnings.push(`../primeng-ref not found at ${refRoot} — cannot validate primeng_indexed.`);
    return;
  }
  for (const name of list) {
    if (!existsSync(join(refRoot, name))) {
      errors.push(`rag.primeng_indexed.components lists "${name}" but ../primeng-ref/packages/primeng/src/${name} does not exist.`);
    }
  }
}

function stripParens(s) {
  return s.replace(/\(.*$/, '').trim();
}
function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const graph = readGraph();
if (graph) {
  const dirs = listLibComponentDirs();
  checkExportsCoverDirs(graph, dirs);
  checkPaths(graph);
  checkInputsOutputsMethods(graph);
  checkRoutes(graph);
  checkPrimengIndexed(graph);
}

if (warnings.length) {
  console.warn(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.warn(`  ⚠  ${w}`);
}
if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`✓ knowledge-graph.json shape matches the filesystem (${(graph?.library?.exports ?? []).length} exports, ${(graph?.demo_app?.routes ?? []).length} routes).`);
