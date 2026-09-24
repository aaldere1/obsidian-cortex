# TypeSafe Jev gates (optional)

Jev is TypeSafe's System One model: send abstracted state and typed questions,
get structured answers. In this vault Jev **gates** startup/closeout/public-sync
decisions. It does **not** write prose, session files, or memory.

Official docs: https://docs.typesafe.ai — HTTP `POST https://api.typesafe.ai/v1/systemone`.

## Enable story (one rule)

Gates stay **off** unless a TypeSafe key is resolvable **or** you opt in.

| Condition | Result |
|---|---|
| `TYPESAFE_API_KEY` present (env or `~/.config/typesafe-helper/env`) | ON |
| `--use-jev` or `BRAIN_JEV=1` | ON (still no-ops without a key, except personal-scrub — see below) |
| `--no-jev` or `BRAIN_JEV=0` | OFF, even if a key is present |
| No key and no opt-in | OFF (today's string guess / caller input unchanged) |

**Fleet turn-on:** `git pull` on each machine picks up the scripts. Each machine still needs `TYPESAFE_API_KEY` in its environment or `~/.config/typesafe-helper/env`. Never commit the key, a `.env`, or a real API value.

## Commands

```sh
node "AI Brain/scripts/brain.mjs" jev-status
node "AI Brain/scripts/brain.mjs" judge-project --guess "folder-name" --cwd "/path/to/repo"
node "AI Brain/scripts/brain.mjs" judge-closeout --had-commits --had-edits --duration-band medium
node "AI Brain/scripts/brain.mjs" judge-scrub --path-kind system-script --content-class engine --filename brain.mjs
```

`startup` and `closeout` accept `--use-jev` / `--no-jev`. Existing flags are unchanged.

## The three gates

1. **Project Choice** — cwd basename + Active Projects / `Projects/` folder names → Jev Choice. Low confidence, `other`, missing key, or API error → keep the caller's guess.
2. **Closeout richness Noul** — abstracted signals only (`had_commits`, `had_file_edits`, `had_pr_or_ship`, `duration_band`). Advisory. **Never blocks closeout.**
3. **Personal-scrub Noul** — public / cortex path only. Asks whether the allowlisted batch looks personal-only. Disabled → existing denylist unchanged. Enabled and unsure / error / missing key → **do not publish**. Jev never overrides the hard denylist to be more permissive.

State sent to TypeSafe is abstracted: basename, booleans, duration band, folder names. No transcripts, no email bodies, no secrets, no home paths.

## Fail-open (and the one fail-safe)

- Missing key = no network call for project/closeout; caller input unchanged.
- API / timeout / low confidence = same as missing key for those two gates.
- Personal-scrub is fail-**safe** when it actually runs: if Jev is enabled and cannot decide, sync refuses to publish. `--no-jev` restores denylist-only sync.

## What this does not do

- Does not add an npm dependency. `jev-gates.mjs` uses Node `fetch` against the official HTTP API.
- Does not mention or sync personal-only areas. Public docs and examples stay abstract.

## Smoke

```sh
# Missing key must no-op (no network):
env -u TYPESAFE_API_KEY BRAIN_JEV=0 node "AI Brain/scripts/brain.mjs" jev-status
env -u TYPESAFE_API_KEY node "AI Brain/scripts/brain.mjs" judge-project --guess "Shop-App"

# Unit tests (mocked HTTP; no key required):
node --test "AI Brain/scripts/jev-gates.test.mjs"
```
