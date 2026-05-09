#!/usr/bin/env node
// Interactive version bump for the dungeon-ui library.
//
// Usage:
//   node scripts/bump-version.mjs                # interactive, suggests patch bump
//   VERSION=0.2.0 node scripts/bump-version.mjs  # non-interactive (for CI)
//
// Writes the new version into `projects/dungeon-ui/package.json` so the
// next `ng build dungeon-ui` propagates it into `dist/dungeon-ui/package.json`.

import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout, env, exit } from 'node:process';

const PKG_PATH = 'projects/dungeon-ui/package.json';
const SEMVER = /^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/;

const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf8'));
const current = pkg.version;

function bumpPatch(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v);
  if (!m) return v;
  const [, major, minor, patch] = m;
  return `${major}.${minor}.${Number(patch) + 1}`;
}

const suggested = bumpPatch(current);
let next;

if (env.VERSION) {
  next = env.VERSION.trim();
} else if (!stdin.isTTY) {
  console.error(
    `Not a TTY and VERSION env var not set.\n` +
      `Usage: VERSION=<x.y.z> node scripts/bump-version.mjs`,
  );
  exit(1);
} else {
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = (await rl.question(
    `Current version: ${current}\nNew version [${suggested}]: `,
  )).trim();
  rl.close();
  next = answer || suggested;
}

if (!SEMVER.test(next)) {
  console.error(`Invalid semver: "${next}". Expected e.g. 0.2.0 or 1.0.0-beta.1.`);
  exit(1);
}

if (next === current) {
  console.log(`Version already ${current}; nothing to bump.`);
  exit(0);
}

pkg.version = next;
writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`Bumped ${PKG_PATH}: ${current} → ${next}`);
