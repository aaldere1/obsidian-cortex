# Global Codex instructions

`~/.codex/AGENTS.md` carries the standing collaboration defaults for every task.
The canonical source is [codex-agents-snippet.md](codex-agents-snippet.md).
It defines completion, relevant context, authorization, proportional verification,
and the AI Brain lifecycle. Use its contextual memory routes instead of loading
every project and machine document.

After resolving the actual vault and `brain.mjs whoami` identity:

```sh
node "AI Brain/scripts/brain.mjs" codex-install "<MACHINE>" --force
```

Start a fresh Codex session to load the updates.

Per-repository instructions should carry only project-specific information.
