# Claude Code hooks — the brain runs itself

Slash commands are the reliable way to drive the protocol, but people forget to type them.
These hooks close the gap: the brain briefs every session on its own, nudges for a closeout
when real work shipped, and writes a safety-net record when a session ends without one.

| Script | Event | What it does |
|---|---|---|
| `brain-skill-sync.sh` | SessionStart | Pulls the vault and re-installs any canonical skill that changed (whole-directory compare). Silent unless something updated. `--doctor` self-test. |
| `brain-auto-startup.sh` | SessionStart | Pulls, reaps ghost sessions (no heartbeat in 48h), runs `snapshot`, and injects a one-line digest — who is active elsewhere, open loops, tracked projects — plus a nudge to run `brain-startup` for meaningful work. |
| `brain-closeout-guard.sh` | Stop | If the transcript shows durable work (commit, push, PR, ship) and no `brain.mjs closeout`, blocks the stop **once** and tells Claude to run `brain-closeout`. |
| `brain-auto-closeout.sh` | SessionEnd | Safety net. If the session edited files or committed inside a git repo but never closed out, writes a mechanical, git-derived session note, idles the machine, and pushes (conflict-safe). Idempotent per session; silent otherwise. |
| `marathon-stop-guard.sh` | Stop | Keeps Claude working while `tasks/marathon.md` has `status: active` and unchecked items. Inert otherwise. See the `marathon` skill. |

Every hook is fail-open: any error exits 0, so a session is never blocked or delayed by the
brain. They are bash-3.2-clean (stock macOS) and need `node`, `git`, `jq`, and `python3`.

## Wire them up

`brain-skill-sync.sh` is wired for you by `node "AI Brain/scripts/brain.mjs" install-claude-hook`.
Add the rest to `~/.claude/settings.json` by hand, pointing at the scripts **in place** in your
vault (they find the vault from their own location). Use absolute paths — `$HOME` is not
expanded in hook commands on every setup:

```json
"hooks": {
  "SessionStart": [
    { "hooks": [ { "type": "command", "command": "bash \"/Users/you/Obsidian-Vault/AI Brain/scripts/hooks/brain-skill-sync.sh\"" } ] },
    { "hooks": [ { "type": "command", "command": "bash \"/Users/you/Obsidian-Vault/AI Brain/scripts/hooks/brain-auto-startup.sh\"", "timeout": 30 } ] }
  ],
  "Stop": [
    { "hooks": [ { "type": "command", "command": "bash \"/Users/you/Obsidian-Vault/AI Brain/scripts/hooks/brain-closeout-guard.sh\"", "timeout": 15 } ] },
    { "hooks": [ { "type": "command", "command": "bash \"/Users/you/Obsidian-Vault/AI Brain/scripts/hooks/marathon-stop-guard.sh\"", "timeout": 15 } ] }
  ],
  "SessionEnd": [
    { "hooks": [ { "type": "command", "command": "bash \"/Users/you/Obsidian-Vault/AI Brain/scripts/hooks/brain-auto-closeout.sh\"", "timeout": 60 } ] }
  ]
}
```

Start a new Claude Code session afterwards. The startup digest appears only once this machine
is registered (`brain.mjs init-machine`), so an unregistered machine stays silent.

### Copying hooks out of the vault instead

If you prefer hooks under `~/.claude/hooks/`, copy `brain-auto-startup.sh` and
`brain-auto-closeout.sh` there and replace `__BRAIN_VAULT_STAMP__` in their `VAULT_STAMP=` line
with your vault's absolute path — a copy cannot find the vault from its own location.
`brain-skill-sync.sh` keeps stamped copies converged with the vault on every session start.

## Check a machine

```sh
bash "<vault>/AI Brain/scripts/hooks/brain-skill-sync.sh" --doctor
```

Read-only. Reports how the vault was resolved and whether installed skills match the vault.
A vault that cannot be resolved is logged to `/tmp/brain-hook.log` instead of failing silently —
see [`../../docs/brain-skill-sync-path-bug.md`](../../docs/brain-skill-sync-path-bug.md).

## Git identity

`brain-auto-closeout.sh` commits with the vault's configured `user.name` / `user.email`. With no
identity configured it leaves the note uncommitted rather than inventing one — a synthesized
author can't be attributed on GitHub and fails author-gated deploys.
