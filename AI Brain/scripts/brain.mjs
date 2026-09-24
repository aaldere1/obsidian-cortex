#!/usr/bin/env node

// This public repository is a reference copy. Its commands run only in the
// owner's verified private vault; this checkout never stores brain activity.
import { access, realpath } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const expectedRepo = 'aaldere1/obsidian-personal';
const allowedUrls = new Set([
  `https://github.com/${expectedRepo}`,
  `https://github.com/${expectedRepo}.git`,
  `git@github.com:${expectedRepo}`,
  `git@github.com:${expectedRepo}.git`,
  `ssh://git@github.com/${expectedRepo}`,
  `ssh://git@github.com/${expectedRepo}.git`,
]);

function command(executable, args, cwd) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 15_000,
  });
  if (result.error || result.status !== 0) throw new Error(`${executable}-check-failed`);
  return result.stdout.trim();
}

function checkedUrls(value) {
  const urls = value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (urls.length !== 1 || !allowedUrls.has(urls[0])) throw new Error('wrong-repository-remote');
}

async function privateVault() {
  const home = os.homedir();
  const configured = process.env.BRAIN_VAULT;
  const candidates = configured
    ? [configured]
    : [path.join(home, 'obsidian-personal'), path.join(home, 'Obsidian-Personal'), path.join(home, 'Obsidian-Vault'), path.join(home, 'GitHub', 'obsidian-personal')];

  for (const candidate of candidates) {
    try {
      const vault = await realpath(candidate);
      const gitRoot = await realpath(command('git', ['rev-parse', '--show-toplevel'], vault));
      if (gitRoot !== vault) throw new Error('not-vault-root');
      checkedUrls(command('git', ['remote', 'get-url', '--all', 'origin'], vault));
      checkedUrls(command('git', ['remote', 'get-url', '--push', '--all', 'origin'], vault));
      const metadata = JSON.parse(command('gh', ['api', '--hostname', 'github.com', `repos/${expectedRepo}`], vault));
      if (metadata.full_name !== expectedRepo || metadata.private !== true) throw new Error('repository-not-private');
      await access(path.join(vault, 'AI Brain', 'scripts', 'brain.mjs'));
      await access(path.join(vault, 'AI Brain', 'Shared', 'Preferences.md'));
      return vault;
    } catch {
      // An explicit wrong BRAIN_VAULT must never fall back to another checkout.
      if (configured) break;
    }
  }
  throw new Error('private-vault-unavailable');
}

try {
  const vault = await privateVault();
  if (process.argv[2] === '--private-vault-path') {
    if (process.argv.length !== 3) throw new Error('unexpected-arguments');
    console.log(vault);
  } else {
    const result = spawnSync(process.execPath, [path.join(vault, 'AI Brain', 'scripts', 'brain.mjs'), ...process.argv.slice(2)], {
      cwd: vault,
      env: { ...process.env, BRAIN_VAULT: vault },
      stdio: 'inherit',
    });
    process.exitCode = result.status ?? 1;
  }
} catch {
  console.error('Public framework stopped: aaldere1/obsidian-personal could not be verified as the private brain. Set BRAIN_VAULT to its checkout and retry. No public brain files were written.');
  process.exitCode = 1;
}
