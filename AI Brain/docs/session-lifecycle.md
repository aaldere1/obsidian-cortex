# AI Brain: How Session Startup & Closeout Work

> **Public framework boundary:** This repository is a reference copy, not a live vault. All machine, project, session, daily, research, and agent-configuration writes belong in a verified private brain. For this owner the destination is private `aaldere1/obsidian-personal`. Set `BRAIN_VAULT` to that private checkout or let the public launcher resolve it. Stop if its identity or privacy cannot be verified. Never commit or push personal brain state to this public repository.

A short guide to the two moments that bookend every meaningful work session with the
AI Brain: **startup** (loading context before we begin) and **closeout** (saving what
happened when we finish). This is the mechanism that lets an AI agent pick up on any
machine, on any day, knowing what was decided and what's next.

---

## 1. The one-paragraph mental model

The "AI Brain" is a plain **Obsidian vault of Markdown files, synced between computers
with git**. It's the agent's long-term memory. Nothing fancy — no database, no embeddings.
Just structured notes: what the projects are, what was decided, what's in progress, and a
log of each work session.

Every real work session follows the same lifecycle:

```
  ┌──────────────┐        do the work        ┌──────────────┐
  │   STARTUP    │  ───────────────────────▶ │   CLOSEOUT   │
  │ load context │                            │  save state  │
  │ + go active  │                            │  + go idle   │
  └──────────────┘                            └──────────────┘
        ▲                                            │
        │            git pull / git push             │
        └──────────── shared vault ──────────────────┘
```

**Startup** answers *"where did we leave off, and is anyone else working on this right now?"*
**Closeout** answers *"what changed, what did we decide, and what's the next action?"* —
written down so the *next* session (possibly on a different machine, possibly weeks later)
starts already knowing.

The two are triggered by natural language. You don't run commands — you just say
"catch me up" or "let's wrap up," and the agent runs the flow.

---

## 2. Why it exists

- **Cross-machine continuity.** Work started on a laptop can continue on a desktop with
  full context, because the state lives in the shared vault, not in one machine's chat history.
- **Cross-session memory.** Chat context is thrown away when a session ends. The Brain
  keeps the durable parts (decisions, next steps) so they survive.
- **Collision avoidance.** Multiple machines can be active at once. Startup checks who
  else is working on what, so two agents don't stomp on the same project.
- **A clean handoff every time.** Closeout forces a tight summary — what changed, what was
  decided, what's next — instead of leaving the next person (or agent) to reconstruct it.

---

## 3. STARTUP — loading context before work

**How it's triggered:** the user says something like *"start a session,"* *"catch me up,"*
*"where did I leave off,"* *"what's the state of X,"* or just begins non-trivial work on a
project. (There's also an automatic hook that pulls the vault and prints a one-line status
banner at the start of every session — that's the `[AI Brain · <machine>]` line you may have
seen.)

**What the agent does, in order:**

1. **Figure out which machine it's on.** Each machine has a stable name in the vault
   (e.g. `Laptop`, `Desktop`). The agent resolves it with `brain.mjs whoami` — never guessing —
   because writing to the wrong machine's folder corrupts another machine's record.

2. **Pull the latest vault** (`git pull --ff-only`) so it's working from current state.
   If the pull fails, it stops and tells the user rather than plowing ahead.

3. **Check who's doing what across machines** (`brain.mjs snapshot`). If another machine
   is `ACTIVE` on the same project within the last ~2 hours, the agent **flags the collision
   before doing anything**.

4. **Read shared + machine memory.** A small, fixed set of files:
   - `Shared/Profile.md`, `Preferences.md`, `Active Projects.md`, `Open Loops.md`
   - `Machines/<machine>/Current Context.md`, `Local Setup.md`

5. **Read the relevant project's memory**, if the work maps to a known project under
   `Projects/<name>/`:
   - `Overview.md` — what the project is
   - `Current State.md` — where it stands right now
   - `Next Steps.md` — what to do next
   - `Decisions.md` — durable choices and their rationale

6. **Register an activity session** (`brain.mjs startup ...`). This writes a live
   "I'm working on X" record and returns a `session_id`. That's what makes this session
   visible to other machines' snapshots, and it's the ID that closeout will later mark idle.

7. **Brief the user in 3–6 lines** — not a data dump. Something like: *"Here's what I know
   about this project, here's what's open, no one else is active on it, here's what I suggest
   doing next."*

**The point of startup:** by the time the agent says its first substantive thing, it has
already loaded the durable context and announced itself to the rest of the fleet.

---

## 4. CLOSEOUT — saving state when work ends

**How it's triggered:** the user says *"wrap up,"* *"we're done,"* *"closeout,"*
*"let's commit,"* *"let's push,"* *"done for today,"* — or the agent recognizes that
meaningful work has finished.

**What the agent does, in order:**

1. **Resolve the machine name again** (same `whoami` step, same reason).

2. **Draft the summary from the session itself.** Using the conversation (and `git status`
   / `git log` if needed to ground it), it writes five things:
   - **Summary** — what changed, 1–3 bullets
   - **Changes** — the concrete files / repos / PRs touched
   - **Decisions** — anything durable that affects future work
   - **Next** — the specific next action, written so *any* agent can pick it up
   - **Questions** — anything unresolved

3. **Write the session record** (`brain.mjs closeout ...`). This creates a dated session
   file under `Projects/<Project>/Sessions/YYYY-MM-DD-HHMM-<slug>.md` and appends a line to
   that machine's `Session Log.md`.

4. **Update the durable project files** *if state actually changed*:
   - `Current State.md` (snapshot / what works / in progress / blockers)
   - `Next Steps.md` (now / soon / later / questions)
   
   If nothing meaningful changed, it skips this — the files stay tight, not bloated.

5. **Promote anything cross-project** to the shared layer: workflow-wide decisions go to
   `Shared/Decisions.md`, cross-project unknowns go to `Shared/Open Loops.md`.

6. **Mark this machine idle** (`brain.mjs idle <machine> --session <id>`). Crucially it
   only clears *this* session's ID — never all of them — so concurrent work on other
   machines stays visible.

7. **Commit and push the vault.** In this vault the standing preference is to commit and
   push on closeout by default — *unless* `git status` shows unfamiliar or unrelated changes,
   in which case the agent stops and asks first.

**The point of closeout:** the next session — anywhere — starts with `Current State.md` and
`Next Steps.md` already reflecting reality, and a dated session file it can read if it needs
the detail.

---

## 5. The pieces under the hood

Everything runs through one helper script, `AI Brain/scripts/brain.mjs`. The commands the
lifecycle uses:

| Command | What it does |
|---|---|
| `whoami` | Resolve hostname → canonical machine folder name |
| `snapshot` | Show who's `ACTIVE`/`idle` across all machines |
| `startup <machine> --agent --project --focus` | Register a live activity session, returns a `session_id` |
| `activity <machine> --session <id> --focus` | Update a running session's focus (heartbeat) |
| `closeout <project> <title> <machine> --summary --next ...` | Write the session file + append to the machine's log |
| `idle <machine> --session <id>` | Mark this session finished |
| `reap <machine> [--hours 48]` | Clean up "ghost" sessions that never closed out |

And the vault layout it reads and writes:

```text
AI Brain/
  Shared/          ← cross-machine: Profile, Preferences, Active Projects,
                     Decisions, Open Loops
  Machines/
    <machine>/     ← one folder per computer: Current Context, Local Setup,
                     Session Log, live Activity records
  Projects/
    <name>/        ← Overview, Current State, Next Steps, Decisions,
                     and a Sessions/ folder of dated session files
  Daily/           ← optional end-of-day rollups across all machines
```

---

## 6. What it will and won't store

- ✅ Preferences, project state, decisions + rationale, next steps, short session summaries,
  machine setup notes.
- ❌ **Never** secrets, API keys, tokens, passwords, or full chat transcripts. Session files
  are a few short bullets, not a log.

---

## 7. The 10-second version

> **Startup** = pull the shared vault, load this project's memory, check no one else is on it,
> announce "I'm working on X." **Closeout** = write down what changed / was decided / is next,
> mark myself done, push it back. In between, do the work. Because it all lives in a git-synced
> vault, the *next* session on *any* machine starts already caught up.
