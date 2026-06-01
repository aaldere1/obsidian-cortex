# Codex AGENTS.md Snippet (Canonical)

This is the **canonical Codex configuration block** for any machine participating in the Obsidian-Vault brain. Paste it into `~/.codex/AGENTS.md` on each Codex-enabled machine, then **replace the placeholders**:

- `<MACHINE>` → this machine's name (e.g., `M5`, `Studio`, `MBP-Studio`)
- `<VAULT>` → this machine's local vault path (e.g., `~/Obsidian-Vault`)

Restart any open Codex session after editing.

When `AGENT-BOOTSTRAP.md` Branch C runs for a Codex agent, this file is what gets copied. Keep it in sync with what's actually live on M5.

---

```markdown
<!-- AI_BRAIN_CODEX_SECTION_START -->
### Obsidian AI Brain Memory

Use the Obsidian AI Brain as the durable cross-session memory system on <MACHINE>.

Memory vault:

```text
<VAULT>/AI Brain
```

**Before any AI Brain command: detect THIS machine's name (CRITICAL).** Every example in this section uses `<MACHINE>` because this file was substituted at install time. If you find yourself about to run a command with a literal machine name that does NOT match this machine, STOP — verify by running:

```sh
hostname
ls <VAULT>/AI\ Brain/Machines/
```

Use the folder name that matches the hostname (case may differ — e.g., `Laptop` hostname → `LAPTOP` folder is fine). If the machine name in this AGENTS.md section differs from what `hostname` reports, this file was installed with the wrong machine name. Stop and re-run `node "<VAULT>/AI Brain/scripts/brain.mjs" codex-install "<actual-machine-name>" --force` before doing any AI Brain writes. **Reason: on 2026-05-21 a Claude Code agent on a second machine wrote Current Activity for the wrong machine because an example used a literal machine name. Same risk applies here.**

At the start of meaningful work:

1. Pull the vault first: `cd <VAULT> && git pull --ff-only`
2. Check who's doing what across machines: `node "AI Brain/scripts/brain.mjs" snapshot` — if another machine is `ACTIVE` on the same project with a recent heartbeat, flag the collision before proceeding.
3. Read shared memory:
   - `<VAULT>/AI Brain/Shared/Profile.md`
   - `<VAULT>/AI Brain/Shared/Preferences.md`
   - `<VAULT>/AI Brain/Shared/Active Projects.md`
   - `<VAULT>/AI Brain/Shared/Open Loops.md`
4. Read <MACHINE> machine memory:
   - `<VAULT>/AI Brain/Machines/<MACHINE>/Current Context.md`
   - `<VAULT>/AI Brain/Machines/<MACHINE>/Local Setup.md`
   - `<VAULT>/AI Brain/Machines/<MACHINE>/Working Projects.md` (if it exists)
   - `<VAULT>/AI Brain/Machines/<MACHINE>/Current Activity.md` (in-flight signal — overwritten on each session start)
5. Read the wiki catalog: `<VAULT>/index.md`. If the task overlaps any synthesis page or entity (under `Synthesis/`, `Infrastructure/`, or `MCPs/`), read those pages too.
6. If the current repo has a matching project under `<VAULT>/AI Brain/Projects/`, read that project's `Overview.md`, `Current State.md`, `Next Steps.md`, and `Decisions.md`.
7. If no project memory exists and the work is meaningful, create it in AI Brain rather than adding memory files to the repo being worked on.
8. Write Current Activity so other machines see this session is live:

```sh
node "AI Brain/scripts/brain.mjs" startup "<MACHINE>" \
  --agent "Codex" \
  --project "Project Name" \
  --focus "One-line description" \
  --cwd "$(pwd)"
```

During meaningful work, bump the heartbeat occasionally:

```sh
node "AI Brain/scripts/brain.mjs" activity "<MACHINE>" --focus "Updated description"
```

At closeout after meaningful work:

1. Update the relevant project memory in AI Brain.
2. Update <MACHINE> machine context if local state changed.
3. Add a short session summary:

```sh
cd <VAULT>
node "AI Brain/scripts/brain.mjs" closeout "Project Name" "Short session title" "<MACHINE>" --summary "What changed" --next "Next action"
```

4. If the session ingested a new source or made wiki edits, log it:

```sh
node "AI Brain/scripts/brain.mjs" log-event ingest|note "Subject"
```

5. Mark this machine idle:

```sh
node "AI Brain/scripts/brain.mjs" idle "<MACHINE>"
```

6. If it's past 5pm and `AI Brain/Daily/<today>.md` does not exist, ask the user about generating the daily rollup:

```sh
node "AI Brain/scripts/brain.mjs" daily "<MACHINE>"
```

Wiki workflow summary: `Synthesis/` is for LLM-maintained cross-cutting pages. `NOTION/` is read-only raw sources. `index.md` is the catalog. `log.md` is the chronological record. See `<VAULT>/AGENTS.md` for the full workflow (ingest/query/lint).

Do not store secrets, credentials, raw terminal logs, or full chat transcripts in AI Brain. Store concise summaries, decisions, next steps, and open questions.

Do not add `AGENTS.md` pointers to every repo by default. Per-repo pointers are optional and should be used only for repos that need project-specific instructions.

### Bootstrap and ongoing protocol

- If this machine has **never been registered** in `AI Brain/Machines/`, do not follow the protocol above yet — first read and execute `<VAULT>/AGENT-BOOTSTRAP.md` to set up.
- Full schema for ongoing operation: `<VAULT>/AGENTS.md`.
- Plain-language guide: `<VAULT>/HOW-IT-WORKS.md`.
<!-- AI_BRAIN_CODEX_SECTION_END -->
```

---

## Automated install

You don't need to copy-paste manually. Use the installer:

```sh
cd <VAULT>
node "AI Brain/scripts/brain.mjs" codex-install "<MACHINE>"
```

It extracts the fenced block from this file, substitutes `<MACHINE>` and `<VAULT>` correctly, and appends to `~/.codex/AGENTS.md`. Idempotent — won't duplicate if the block is already present.

## Why this file exists

Without this canonical snippet, new-machine onboarding for Codex would require copying from M5's `~/.codex/AGENTS.md` — which is brittle (M5 might not be available, the file might have drifted, the user might not know where to find it). Keeping it in the vault means:

- Every machine has access via `git pull`
- Version control catches accidental edits
- `brain.mjs codex-install` can reliably point Codex agents to a single canonical source
- M5's `~/.codex/AGENTS.md` can also be regenerated from this if it ever gets corrupted

When you change the Codex protocol on M5, update this file too. The two should stay in sync.
