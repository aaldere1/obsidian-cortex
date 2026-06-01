# Automation Roadmap

Purpose: Capture the future automation direction without building it into v0.

The first version of AI Brain should stay manual and Markdown-first. Automation should be added only after the files prove useful by hand.

## Goal

Continuously collect useful summaries of Codex/Claude work across computers and keep them synced through the Obsidian vault GitHub repo.

The automation should help future agents answer:

- What did we recently work on?
- What changed in important projects?
- What skills, scripts, or workflows were created?
- What decisions or open loops should carry forward?
- What machine-specific context matters?

## Non-Goals

- Do not store secrets, tokens, passwords, cookies, API keys, or credentials.
- Do not dump full chat transcripts.
- Do not build embeddings or vector search in v0.
- Do not create hidden state that Obsidian users cannot easily inspect.

## Safe Data To Collect

- Short session summaries
- Git commit and branch summaries
- PR, issue, and CI status summaries
- New or changed skill names and short descriptions
- Project current state and next steps
- Machine setup changes
- Explicit decisions and open questions

## Risky Data To Avoid

- Raw chat logs
- Raw terminal logs
- `.env` files
- Auth files
- Browser cookies
- SSH keys
- Private credentials in config files
- Large generated artifacts

## Suggested Phases

### Phase 1 - Manual Closeout

Codex writes a session summary into:

```text
AI Brain/Projects/<project>/Sessions/YYYY-MM-DD-HHMM-title.md
```

Then it updates:

- `Current State.md`
- `Next Steps.md`
- machine `Current Context.md`
- relevant `Decisions.md`
- relevant `Open Loops.md`

### Phase 2 - Local Summarizer Command

Add a command that creates a draft summary from local, inspectable sources:

- `git status`
- recent commits
- current branch
- changed files
- selected local memory files

The command should write a draft Markdown file and require review before commit.

### Phase 3 - Polling Indexes

Add lightweight polling for safe indexes only:

- changed files in `AI Brain/`
- new project session summaries
- new or changed skills
- recent GitHub PR/issue summaries

The poller should update human-readable index files, not a database.

### Phase 4 - Cross-Computer Sync Routine

Each computer can run:

```sh
git pull
node "AI Brain/scripts/brain.mjs" status
git add "AI Brain"
git commit -m "Update AI Brain memory"
git push
```

The exact command can be designed later. For v0, avoid background automation.

## First Automation Built

The helper now supports:

```sh
node "AI Brain/scripts/brain.mjs" status
node "AI Brain/scripts/brain.mjs" scan-repos "/path/with/projects"
node "AI Brain/scripts/brain.mjs" install-agent-pointer "Project Name" "/path/to/repo" "Laptop"
node "AI Brain/scripts/brain.mjs" closeout "Project Name" "Short title" "Laptop" --summary "What changed" --next "Next action"
```

This is the first safe automation layer:

- discover repos that need setup
- add optional per-repo AI Brain pointers only when needed
- create reviewed session summaries
- avoid raw transcript capture

## Next Automation To Build Later

Build a draft summarizer that inspects local repo state and pre-fills closeout fields:

```sh
node "AI Brain/scripts/brain.mjs" draft-closeout "Project Name" "/path/to/repo" "Laptop"
```

It should inspect safe local sources only:

- current branch
- `git status --short`
- recent commits
- changed file names
- existing project `Current State.md` and `Next Steps.md`

It should create a draft Markdown summary for Codex/user review before committing.
