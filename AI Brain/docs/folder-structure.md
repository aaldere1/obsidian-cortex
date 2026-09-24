# Suggested Folder Structure

> **Public framework boundary:** This repository is a reference copy, not a live vault. All machine, project, session, daily, research, and agent-configuration writes belong in a verified private brain. For this owner the destination is private `aaldere1/obsidian-personal`. Set `BRAIN_VAULT` to that private checkout or let the public launcher resolve it. Stop if its identity or privacy cannot be verified. Never commit or push personal brain state to this public repository.

```text
AI Brain/
  Shared/
    Profile.md
    Preferences.md
    Active Projects.md
    Decisions.md
    Open Loops.md

  Machines/
    Codex - Computer 1/
      Current Context.md
      Session Log.md
      Local Setup.md

    Codex - Computer 2/
      Current Context.md
      Session Log.md
      Local Setup.md

  Projects/
    Obsidian-AI-Brain/
      Overview.md
      Current State.md
      Decisions.md
      Next Steps.md
      Sessions/
        YYYY-MM-DD-session-title.md
```

Use one folder per computer under `Machines/`. Use one folder per important project under `Projects/`.

Templates live in `templates/` so they can be copied manually or through `scripts/brain.mjs`.
