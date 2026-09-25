---
name: brain-startup
description: Brief the agent on the current state of the Obsidian AI Brain at the start of meaningful work. Reads cross-machine snapshot, shared memory, this machine's context, and relevant project memory; creates a per-session activity record so concurrent tasks remain visible. Use when the user starts or resumes a work session, asks to be caught up on what they or another machine were doing, or asks the state of a project — and at the start of any non-trivial session that would benefit from prior decisions and context.
---

# brain-startup

Reads the Obsidian AI Brain at the start of a session and creates an independent activity record so other machines see every in-flight task.


## When to invoke

- Start of any meaningful work session
- User says "what was I doing", "catch me up", "where did I leave off", "what's the state of X"
- Starting work in a project repo and you need the durable context
- After a long gap when in-flight state from another machine might be relevant

## What to do

### 0a. Resolve the vault path (DO NOT assume `~/Obsidian-Vault`)

The vault lives at a different path on each machine. Resolve it, never hardcode it:

```sh
VAULT="${BRAIN_VAULT:-}"
if [ -z "$VAULT" ]; then
  for c in "$HOME/Obsidian-Vault" "$HOME/obsidian-cortex" \
           "$HOME/Obsidian/Personal" "$HOME/GitHub/obsidian-cortex"; do
    [ -d "$c/AI Brain" ] && { VAULT="$c"; break; }
  done
fi
echo "vault: ${VAULT:?could not find the vault — set BRAIN_VAULT}"
```

Every `cd "$VAULT"` below depends on this. Known paths in a real fleet have included
`~/Obsidian-Vault`, `~/obsidian-cortex`, `~/GitHub/obsidian-cortex` and
`~/Obsidian/Personal` — one per machine. Background: `AI Brain/docs/brain-skill-sync-path-bug.md`.


### 0b. Resolve THIS machine's stable name (CRITICAL — DO NOT SKIP)

**Every example in this skill uses `<MACHINE>` as a placeholder.** You MUST substitute your actual machine name. Do NOT copy `"Laptop"` or any literal name from this doc — that's just the example machine.

Resolve the network hostname or alias to the canonical AI Brain folder:

```sh
cd "$VAULT"
node "AI Brain/scripts/brain.mjs" whoami
```

Use the reported `canonical:` value. The stable AI Brain name may differ from `hostname`; aliases are defined in `AI Brain/Machines/aliases.json`. If `registered: no`, invoke the `brain-bootstrap` skill instead.

**Use the matched folder name as `<MACHINE>` in every command below.** Never type a machine name copied from an example — writing under the wrong name overwrites another machine's Current Activity.

### 1. Pull latest vault state

```sh
cd "$VAULT"
git pull --ff-only
```

If the pull fails or there are local changes, surface that to the user before proceeding.

Then read `AI Brain/Shared/Fleet Apply Queue.md`: apply any Open item that affects this machine, record this machine and today's date under its **Applied on**, and push. A fleet-useful learning from this session goes back into the queue the same way.

### 2. Check who's doing what across machines

```sh
node "AI Brain/scripts/brain.mjs" snapshot
```

If another machine shows `ACTIVE` with a recent heartbeat (within ~2 hours) on the same project the user wants to work on, **flag the collision before proceeding**.

### 3. Read shared and machine memory

Read these files into context (in this order):

- `AI Brain/Shared/Profile.md`
- `AI Brain/Shared/Preferences.md`
- `AI Brain/Shared/Active Projects.md`
- `AI Brain/Shared/Open Loops.md`
- `AI Brain/Machines/<MACHINE>/Current Context.md`
- `AI Brain/Machines/<MACHINE>/Local Setup.md`
- `AI Brain/Machines/<MACHINE>/Working Projects.md` (may not exist on newer machines — skip if missing)

Substitute `<MACHINE>` with the name you detected in Step 0.

### 3.5. Auto-heal empty machine templates (one-time per machine)

After reading the machine files above, check whether `Local Setup.md` or `Current Context.md` are still template-only (headings with empty `-` bullets, no real values, file size typically under ~700 bytes). If they are, fill them in silently — this is one-time-per-machine cleanup, not something to bug the user about.

**Local Setup.md** — observable from this machine, fill it in with no user interaction:

```sh
echo "hostname=$(hostname)"
echo "os=$(uname -sr)"
echo "shell=$SHELL"
echo "node=$(node --version 2>/dev/null || echo 'not installed')"
echo "python=$(python3 --version 2>&1 || echo 'not installed')"
echo "git=$(git --version | awk '{print $3}')"
```

Use the output to populate the `## Machine`, `## Vault Location`, and `## Tools Installed` sections. Vault path is `"$VAULT"` (resolve `~` to the actual home dir). Set `Last updated:` to today's date. Use the Edit tool — don't overwrite the whole file, just replace the empty bullets.

**Current Context.md** — write a minimal honest placeholder; don't fabricate context:

- `## Current Focus`: `- (none — fill in when this machine has a recurring focus)`
- `## Recent Work`: `- (none yet)`
- `## Local Constraints`: leave whatever was bootstrapped
- `## Next Agent Should Know`: `- Read AI Brain/Shared/ first for cross-machine context.`
- `## Do Not Touch Without Asking`: leave whatever was bootstrapped

If either file already has real content (over ~700 bytes, or any bullet has a value after `:`), **leave it alone** — don't overwrite user-curated text.

Briefly mention the fill-in to the user in your closing brief (one sentence, not a section): *"Filled in this machine's Local Setup template since it was empty."*

### 4. If a project is implied, read its memory

Look at the user's first message and the current `cwd`. If a project under `AI Brain/Projects/<name>/` matches, read:

- `Overview.md`
- `Current State.md`
- `Next Steps.md`
- `Decisions.md`

If no project memory exists for an obviously meaningful project, suggest creating one with `node "AI Brain/scripts/brain.mjs" init-project "Project Name"` before continuing.

### 5. Check the wiki index for related synthesis pages

Read `index.md` (vault root). If the user's task overlaps with any entry under `Synthesis/`, `Infrastructure/`, or `Tools/`, read those pages too.

### 6. Start an activity session on this machine

```sh
node "AI Brain/scripts/brain.mjs" startup "<MACHINE>" \
  --agent "Claude Code" \
  --project "<Project Name>" \
  --focus "<one-line description of what you're about to do>" \
  --cwd "$(pwd)"
```

Capture the returned `session_id` and retain it as `<SESSION_ID>` for this task. Heartbeat and closeout commands must target that ID when concurrent sessions exist.

Choose `<Project Name>` to match an `AI Brain/Projects/<name>/` folder if possible. If the work doesn't fit a known project, use a short topical label.

### 7. Brief the user

In 3–6 lines, tell the user:

- What you already know about this project (from the memory you just loaded)
- What's currently open (Next Steps + Open Loops items that match)
- Whether another machine is active on it (from the snapshot)
- What you suggest doing next

Do not dump the raw memory at the user. Summarize.

### 8. (Optional) Push the activity record

If the work session is going to be substantial, push so other machines see it:

```sh
cd "$VAULT" && git add "AI Brain/Machines/<MACHINE>/Activities/<SESSION_ID>.md" "AI Brain/Machines/<MACHINE>/Current Activity.md" && git commit -m "<MACHINE> startup: <focus>" && git push
```

For quick sessions, skip the push — the closeout will carry the activity with the session file.

## Rules

- Never store secrets, credentials, or full chat transcripts
- Read **only what's relevant** — do not bulk-load session history unless the user asks
- If you're already mid-session and the user invokes this, do the snapshot + brief but do not create a second activity file for the same task

- When handing work to another agent, give it the Brain note path and tell it to read the note rather than trusting your summary.
- A live project or session carries an explicit `Stop when:` done condition.
