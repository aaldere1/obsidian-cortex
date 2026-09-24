# Lesson: silent vault-path and machine-identity failures

Two bugs from a real multi-machine fleet, both fixed. They share one shape: a guess that
fails *silently*, so nothing ever surfaces. The fixes are in the engine and hooks; this page
explains them so you recognise the class.

## 1. Hooks that guessed the vault path

Early hook scripts resolved the vault like this:

```sh
VAULT="${BRAIN_VAULT:-$HOME/Obsidian-Vault}"
[ ! -d "$VAULT/.git" ] && exit 0        # silent, by design
```

On a machine whose vault lived anywhere else (`~/Obsidian/Personal`, `~/GitHub/…`), the hook
exited 0 with no output — indistinguishable from *a machine with no vault*. One laptop ran
for months with its skills never syncing. Others worked only by luck: a case-insensitive
filesystem matching a differently-cased folder, or a hand-made symlink.

**Fix.** Every script now resolves in this order:

1. **`$BRAIN_VAULT`** — if set *and* it validates (contains `AI Brain/` and `.git`). A wrong
   explicit value never silently falls back elsewhere.
2. **Self-derivation** — walk up from the script's own location until a directory contains
   both `AI Brain/` and `.git`. Works at any vault path, any depth.
3. **Probe** a few common layouts.
4. **Give up — but log** one line to `/tmp/brain-hook.log`. Hooks still exit 0 so a session is
   never blocked; installers exit 1 with an actionable message.

Hooks copied *out* of the vault (to `~/.claude/hooks/`) can't self-derive, so they carry a
`VAULT_STAMP=` line you fill with the real path. See [`../scripts/hooks/README.md`](../scripts/hooks/README.md).

**Check any machine:**

```sh
bash "<vault>/AI Brain/scripts/hooks/brain-skill-sync.sh" --doctor
```

`verdict: BROKEN` means the machine genuinely cannot find its vault; anything else works.

## 2. `whoami` trusted the hostname

The skills resolve the machine with `brain.mjs whoami` rather than guessing. On one laptop
with macOS `HostName` unset, `os.hostname()` fell back to a DHCP-derived `Mac` — which was
the literal folder name of a *different, live* machine. Following the documented procedure
would have written one machine's session records into another's folder.

**Fix.** `whoami` now prefers the alias hit on the stable `LocalHostName`
(see `AI Brain/Machines/aliases.json`), falls back to `hostname` only when that yields
nothing, and prints `warning: ambiguous machine identity` on **stderr** when the two resolve
to different folders. Explicit machine arguments are untouched.

**Rule for agents:** read `whoami`'s stderr. If the resolved name looks like another machine,
stop and check `aliases.json` before writing anything.

## The general lesson

A fallback that exits quietly is worse than a crash: it looks exactly like success. Make every
"nothing to do" path distinguishable from "couldn't look" — log it, or give it a doctor.
