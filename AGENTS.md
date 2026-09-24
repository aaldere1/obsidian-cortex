# Agent instructions

## Is this the public template or a private vault?

Check before writing any brain state (machine records, project memory, session notes,
daily summaries, shared files):

```sh
git remote get-url origin
gh repo view --json visibility -q .visibility   # if gh is available
```

- **Public `obsidian-cortex` template** (or any repository that is not private): this is the
  reusable framework, not a vault. Change only framework files — engine, skills, hooks,
  templates, docs. Never write personal memory, research corpora, or user-specific agent
  wiring here, and never fall back to this checkout when the real vault can't be found.
- **The user's private vault** (a private copy made per `START-HERE.md` step 1b): this is the
  brain. Follow the lifecycle in `AI Brain/docs/session-lifecycle.md` —
  `brain.mjs whoami`, `startup`, `closeout`, `idle`.

If you can't tell which one you are in, stop and ask before writing.
