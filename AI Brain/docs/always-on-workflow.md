# Always-On AI Brain Workflow

Purpose: Explain how AI Brain stays useful over time across many Codex chats, projects, and computers.

## Short Version

AI Brain gets smarter when every meaningful Codex session does two things:

1. At startup, read the relevant memory.
2. At closeout, write a short summary and update next steps.

This is not automatic raw transcript capture. That is intentional. The useful memory is the cleaned-up summary: what changed, what was decided, what remains open, and what should happen next.

## Preferred Setup: Global Codex Instructions

To avoid polluting every repo, M5 uses global Codex instructions instead of adding `AGENTS.md` to every project.

Global instructions live here:

```text
~/.codex/AGENTS.md
```

That file tells Codex agents on M5 to read and update:

```text
~/Obsidian-Vault/AI Brain
```

This is the default path for all projects on M5.

## Optional Setup: Per-Repo Pointer

Some repos may still benefit from their own `AGENTS.md`, but this should be optional. Use it only when a repo needs project-specific instructions or when an agent does not seem to load the global instructions.

A per-repo pointer says:

- where the AI Brain vault is
- which machine folder to read
- which project memory folder to read
- how to close out the session

Use:

```sh
cd ~/Obsidian-Vault
node "AI Brain/scripts/brain.mjs" install-agent-pointer "Project Name" "/path/to/repo" "M5"
```

This creates or updates `/path/to/repo/AGENTS.md` with a marked AI Brain section.

## Scan Repos Without Editing Them

```sh
cd ~/Obsidian-Vault
node "AI Brain/scripts/brain.mjs" scan-repos ~
```

The output shows:

- `vault` for the Obsidian AI Brain vault itself
- `linked` when the repo has an optional AI Brain pointer
- `missing` when the repo does not have a pointer

`missing` does not automatically mean "bad." With global Codex instructions, most repos can stay untouched.

## Close Out A Session

At the end of meaningful work, Codex should create a short session summary:

```sh
cd ~/Obsidian-Vault
node "AI Brain/scripts/brain.mjs" closeout "Project Name" "Short session title" "M5" \
  --summary "What changed" \
  --changes "Files, repos, or areas touched" \
  --decisions "Important decisions" \
  --next "Next action"
```

The command writes a file under:

```text
AI Brain/Projects/Project Name/Sessions/
```

It also appends to:

```text
AI Brain/Machines/M5/Session Log.md
```

Codex should still update these files manually when needed:

```text
AI Brain/Projects/Project Name/Current State.md
AI Brain/Projects/Project Name/Next Steps.md
AI Brain/Projects/Project Name/Decisions.md
AI Brain/Shared/Open Loops.md
```

## What Should Be Saved

Save:

- concise summaries
- durable decisions
- next steps
- unresolved questions
- links to relevant files, commits, PRs, issues, or docs
- project state that future Codex sessions need

Do not save:

- secrets
- API keys
- auth tokens
- passwords
- cookies
- SSH keys
- full chat transcripts
- raw terminal logs
- huge generated logs

## Recommended Rollout On M5

Default: do not add files to every repo.

Use the global instruction file at `~/.codex/AGENTS.md`.

Only add a per-repo pointer for a repo that needs extra reliability or repo-specific instructions:

```sh
node "AI Brain/scripts/brain.mjs" install-agent-pointer "My-Project" "~/code/my-project" "M5"
```

Then commit the `AGENTS.md` change in that one project repo.

## What Automation Can Do Later

Good automation:

- remind Codex to close out
- generate draft summaries from git status and recent commits
- scan repos without editing them
- index recent session summaries
- summarize GitHub issues and PRs

Risky automation:

- silently collecting every chat transcript
- scraping private app state
- reading credential files
- writing memory without review

The right next automation is a `session-closeout` habit first, then a draft summarizer that Codex reviews before committing.

## Mental Model

AI Brain is not a surveillance system.

It is a shared project notebook that Codex updates on purpose.

The goal is not to remember everything. The goal is to remember the parts that make the next session faster and less confused.
