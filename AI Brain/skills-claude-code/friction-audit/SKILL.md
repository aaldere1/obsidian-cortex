---
name: friction-audit
description: Use when the user wants a retro across recent Claude Code sessions — "review recent sessions", "where did I hit friction", "what's been slowing us down", "audit my workflow", "propose new skills/hooks/CLAUDE.md fixes from past sessions" — or on a recurring cadence to keep tooling tuned to observed pain.
---

# Friction Audit

## Overview

Mine `~/.claude/projects/` transcripts for user friction (corrections, interruptions, denials, error loops, re-prompts), cluster it, and convert each cluster into a concrete fix: a Skill, a hook/automation, or a CLAUDE.md rule. Privacy rule: transcripts never leave the machine — mechanical extraction is local (grep/jq), judgment work uses Claude subagents only, never third-party cloud tiers.

## When to Use

- User asks for a retro, workflow audit, or "what keeps going wrong"
- Recurring cadence (weekly/monthly) to keep skills and CLAUDE.md matched to real pain
- After a rough stretch — many interrupts, reverts, or "still broken" sessions

**Not for:** debugging one specific session (just read it), or code-level review (/code-review).

## Pipeline

### Phase 1 — Mechanical scan (local, fast)

```bash
bash ~/.claude/skills/friction-audit/scripts/friction-scan.sh <scratch-dir>/friction [days=30] [this-session-id]
```

**Always pass your own session id as the 3rd argument.** `$CLAUDE_SESSION_ID` is not exported into
the Bash tool environment, so the built-in fallback silently does nothing — pass it explicitly (it
is the uuid in your scratchpad path).

Produces `signals.tsv` (per-session: errors, interrupts, denials, api_errors) and `user_prompts.txt` (typed prompts only).

### Phase 2 — Aggregate and rank

```bash
# by project
awk -F'\t' 'NR>1 {er[$1]+=$6; ir[$1]+=$7; dn[$1]+=$8; ae[$1]+=$9; n[$1]++} END {for (p in n) {s=er[p]+3*ir[p]+3*dn[p]+2*ae[p]; if (s>0) printf "%6d score | %4d err %3d int %3d deny %3d apierr | %3d sess | %s\n", s, er[p], ir[p], dn[p], ae[p], n[p], p}}' signals.tsv | sort -rn | head -12
# top sessions (weight interrupts/denials 3x, api errors 2x)
awk -F'\t' 'NR>1 {s=$6+3*$7+3*$8+2*$9; if (s>0) printf "%5d | %s | %s/%s\n", s, $3, $1, $2}' signals.tsv | sort -rn | head -15
```

Also mine the prompt corpus for themes (case-insensitive grep): context/compact/rate limit; where are we/status; handoff/another agent; doesn't work/still broken; revert/undo/wrong; don't stop/100% done; and error-message histograms from top sessions.

**Exclude the CURRENT session** — from the top-session list AND from the prompt corpus. It ranks
high on its own scan activity, and its prompts skew every theme grep. `friction-scan.sh` drops it
when given the 3rd argument above. If you did not pass it, the corpus is contaminated: re-run
rather than trusting the theme counts.

### Phase 3 — Deep-read fan-out (Workflow, one agent per top session)

Take top 10-15 sessions, then launch `scripts/deep-read-workflow.js` via the Workflow tool with `args = {sessions: [{path, label, signals}, ...]}`. Each agent returns structured events with taxonomy: `premature-stop`, `context-loss`, `wrong-target`, `verification-gap`, `tool-error-loop`, `permission-friction`, `infra-flake`, `scope-misread`, `rework`, `other`.

Requires the user to have opted into multi-agent orchestration; if not, offer it or fall back to serial Explore agents.

### Phase 4 — Cluster and convert to fixes

Merge Phase 2 stats + Phase 3 narratives + `tasks/lessons.md` (if present). For each cluster pick the *cheapest durable* fix:

| Friction cluster | Fix type |
|---|---|
| Same instruction repeated across sessions ("don't stop until done") | CLAUDE.md rule or output style |
| Multi-step procedure re-derived each time | New Skill |
| Mechanical check forgotten (build target, device install) | Hook (PreToolUse/Stop) or script |
| Recurring scheduled need (status rollup, PR babysit) | Automation (cron, /loop, headless `claude -p`) |
| Permission prompts on safe commands | settings.json allowlist entry |
| Tool/infra errors (blind writes, edit collisions) | Subagent prompt hygiene or orchestration change |

Deliverables: findings report (clusters ranked by cost, with verbatim quotes), proposed CLAUDE.md diff (propose — don't apply unasked), new skill scaffolds, and an updated `tasks/lessons.md` entry. Re-run quarterly and diff against the previous report.

## Common Mistakes

- `grep -oE` with `.{0,N}` context windows fails on the prompt corpus: if `grep` is ugrep (a common alias), it rejects them as "exceeds complexity limits" **and still exits 0**, so a backgrounded run looks successful while producing nothing. Extract context with python, not grep.
- Grep histograms over raw transcripts give false positives from SOURCE CODE and DOCS, not just tool output — `setTimeout` reads as "timeout", a "rate limit" row in an architecture table reads as an API error. Inflated a 2026-08-31 run to 1,360 fake timeouts and 222 fake API errors. Count only strings that appear exclusively in tool results (`File has not been read yet`, `String to replace not found`, `cwd was reset`, `command not found`), and sample the surrounding context before believing any count.
- `grep -c pattern file || echo 0` — grep prints `0` AND exits 1 on no-match; the `||` doubles the field and corrupts the TSV. Use the `count()` helper in the scan script.
- Counting prompts with `wc -l` before newlines are flattened (`gsub("\n"; " ")` in jq) — multi-line prompts inflate counts ~5x.
- Passing Workflow `args` and assuming it's an object — it may arrive as a JSON string; parse defensively (`typeof args === 'string' ? JSON.parse(args) : args`).
- Letting deep-read agents `Read` whole transcripts — sessions run 5-15MB; they must use the jq/grep recipes.
- Ranking wf_* / subagents/ transcripts alongside user sessions — agent-side noise buries user friction.
- Shipping fixes for hypothetical friction — every proposal must cite observed events (quote + session).
