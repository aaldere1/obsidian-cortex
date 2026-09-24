---
name: marathon
description: Use when starting or resuming a long multi-item autonomous run — a package/PR shipping loop, a multi-hour audit-fix sweep, any "don't stop until 100%" goal that may outlive one context window — or when the user says "marathon", "run until done", "loop until complete", or a marathon-stop-guard message appears.
---

# Marathon

## Overview

Makes long autonomous runs survive context exhaustion, /clear, session limits, and power loss without the user acting as the persistence layer. One durable state file is the single source of truth; a Stop hook (`~/.claude/hooks/marathon-stop-guard.sh`, registered in user settings) blocks premature stops while it has unchecked items.

## Starting a marathon

Create `tasks/marathon.md` in the project root:

```markdown
goal: <one line — what 100% done means>
status: active
branch-to-test: <branch or "main after merges">
next: <first action>

- [ ] item 1
- [ ] item 2
...
```

Rules while a marathon is active:
- Tick items off (`- [x]`) THE MOMENT they complete; update `next:` and `branch-to-test:` at every milestone (merge, green build, phase done). The state file must always be resumable-from.
- At ~80% context: update the state file fully, then keep working — the next window resumes from it.
- Never offer mid-marathon testing handoffs; the user tests once, at 100%.
- After any /clear, compaction, or handoff: Read files before editing them.

## Stopping

The Stop hook only allows the turn to end when one of these is true:
- `status: done` — everything checked, goal verified.
- `status: paused` + `blocked: <exactly what is needed>` — genuinely blocked on the user.
- All items checked.

Loop guard: in a stop-hook continuation, if the state file goes untouched for 10+ minutes the hook allows the stop with a warning instead of looping.

## Resuming

Any session: "Read tasks/marathon.md and continue." Headless (manual, /loop, or launchd):

```bash
bash ~/.claude/skills/marathon/scripts/marathon-resume.sh /path/to/repo
```

## Common Mistakes

- Putting the tracker only in conversation context — it dies with the window. The file is the tracker.
- Batching checkbox updates "at the end" — a crash loses the progress record.
- Setting `status: paused` without a `blocked:` line — the next session won't know why it stopped.
- Leaving `status: active` after finishing — the Stop hook will keep firing in that project.
