# Codex AGENTS.md Snippet (Canonical)

This is the **canonical Codex configuration block** for any machine participating in the Obsidian-Vault brain. Paste it into `~/.codex/AGENTS.md` on each Codex-enabled machine, then **replace the placeholders**:

- `<MACHINE>` → this machine's name
- `<VAULT>` → this machine's local vault path

Restart any open Codex session after editing.

---

```markdown
<!-- AI_BRAIN_CODEX_SECTION_START -->
### Obsidian AI Brain Memory

Use the Obsidian AI Brain as the durable cross-session memory system on <MACHINE>.

Memory vault:

```text
<VAULT>/AI Brain
```

**Before any AI Brain command, resolve THIS machine's name:**

```sh
node "<VAULT>/AI Brain/scripts/brain.mjs" whoami
```

Use the reported `canonical:` value. If `registered: no`, bootstrap this machine before AI Brain writes.

At the start of meaningful work:

1. Pull the vault: `cd <VAULT> && git pull --ff-only`
2. Run `node "AI Brain/scripts/brain.mjs" snapshot`; flag active collisions on the same project.
3. Read shared memory:
   - `<VAULT>/AI Brain/Shared/Profile.md`
   - `<VAULT>/AI Brain/Shared/Preferences.md`
   - `<VAULT>/AI Brain/Shared/Active Projects.md`
   - `<VAULT>/AI Brain/Shared/Open Loops.md`
4. Read <MACHINE> machine memory:
   - `<VAULT>/AI Brain/Machines/<MACHINE>/Current Context.md`
   - `<VAULT>/AI Brain/Machines/<MACHINE>/Local Setup.md`
   - `<VAULT>/AI Brain/Machines/<MACHINE>/Working Projects.md` if present
   - `<VAULT>/AI Brain/Machines/<MACHINE>/Current Activity.md`
5. Read `<VAULT>/index.md` and relevant synthesis/tool/infrastructure pages.
6. If the current repo has matching project memory, read Overview, Current State, Next Steps, and Decisions.
7. **Specialist knowledge domains:** if the task involves Swift, SwiftUI, iOS/iPadOS/macOS app development, Metal, shaders, Xcode/Instruments, or Apple-platform performance, read:
   - `<VAULT>/AI Brain/Knowledge/Apple Platforms/INDEX.md`
   - `<VAULT>/AI Brain/Knowledge/Apple Platforms/Actions/ACTION-REGISTER.md`
   - only the relevant topic pages.
   Prefer current primary-source-verified brain knowledge over recalled framework behavior. Respect SHIPPING/BETA deployment gates. Performance work must include a measurement/verification step.
8. If no project memory exists and the work is meaningful, create it in AI Brain rather than adding memory files to the repo.
9. Register the activity:

```sh
node "AI Brain/scripts/brain.mjs" startup "<MACHINE>" \
  --agent "Codex" \
  --project "Project Name" \
  --focus "One-line description" \
  --cwd "$(pwd)"
```

During meaningful work, bump the heartbeat with `brain.mjs activity`.

At closeout:
1. Update relevant project/machine memory.
2. Run `brain.mjs closeout`.
3. Log wiki/knowledge ingestion when applicable.
4. Mark the machine/session idle.
5. If Apple-platform research produced a durable new technique or changed API status, update the canonical Apple Platforms knowledge pages and action register rather than leaving the discovery only in a session summary.

Do not store secrets, credentials, raw terminal logs, or full chat transcripts.

### Bootstrap and ongoing protocol

- If this machine has never been registered, read and execute `<VAULT>/AGENT-BOOTSTRAP.md`.
- Plain-language guide: `<VAULT>/HOW-IT-WORKS.md`.
<!-- AI_BRAIN_CODEX_SECTION_END -->
```

---

## Automated install

```sh
cd <VAULT>
node "AI Brain/scripts/brain.mjs" codex-install "<MACHINE>"
```

Use `--force` to refresh an existing installed block after this canonical file changes.
