# 🪨 START HERE — Onboard a Machine in ~5 Minutes

You're setting up a new computer to join your Obsidian Cortex brain (the shared vault your agents read on every machine).

**The fast way:** don't run these steps by hand. Open your AI agent (Claude Code or Codex) **inside the cloned vault** and paste the prompt below — it'll do the whole setup for you. The manual steps are here as a fallback and so you understand what's happening.

---

## ⚡ The fast way — let the agent do it

1. Clone the repo as your vault and open your agent in it:

   ```sh
   cd ~
   git clone https://github.com/YOUR-USERNAME/obsidian-cortex.git Obsidian-Vault
   cd Obsidian-Vault
   claude     # or: codex
   ```

2. Paste this prompt:

   > **Onboard this machine to the Obsidian Cortex brain.** Read `START-HERE.md` in this repo and do every step for me:
   > pick a short stable machine name based on this computer's hostname, register the machine with `brain.mjs init-machine`, run `startup` so other machines see it, install the Claude Code skills + sync hook (and/or the Codex `AGENTS.md` block), then commit and push my machine's files. Tell me the machine name you chose and confirm each step succeeded. If anything fails, show me the exact error.

3. That's it. The agent reads this file and runs everything. When it finishes, your machine is in the brain.

> **Why a prompt instead of a quick-start?** Because typing CLI setup by hand in the age of AI is backwards. Hand the agent the goal; it does the work.

---

## 🎛️ Using the brain (every session)

Once set up, drive the brain with **slash commands** — they're the reliable trigger:

| Command | When | What it does |
|---|---|---|
| **`/brain-startup`** | start of a session | pulls the vault, shows activity across machines, briefs you, marks this machine active |
| **`/brain-closeout`** | done working / "push it" | writes a session summary, updates project state, marks the machine idle |
| **`/brain-daily`** | end of day | rolls up the day's sessions into `Daily/` |

> ⚠️ **Reality check:** Claude Code *can* auto-fire skills from natural phrases ("wrap up", "catch me up"), but that discovery is **probabilistic and often doesn't fire**. Use the slash commands — they always work. Treat natural-language triggers as a nice-to-have, not the path.

---

## 🔧 The manual way (fallback)

If you'd rather run it yourself, or the agent hits a wall:

### Prerequisites
```sh
git --version       # 2.x+
node --version      # 18+
```
Install with `brew install git node` (macOS) if missing. You also need clone access to your vault repo.

### 1. Clone
```sh
cd ~
git clone https://github.com/YOUR-USERNAME/obsidian-cortex.git Obsidian-Vault
cd Obsidian-Vault
ls "AI Brain"      # → Daily Machines Projects Shared docs scripts skills-claude-code templates
```

### 2. Pick a machine name
Short, stable, never renamed. e.g. `Laptop`, `Studio`, `Mac-Mini`, `Win-Desktop`.
Replace `<MACHINE>` with it in every command below.

### 3. Register this machine
```sh
node "AI Brain/scripts/brain.mjs" init-machine "<MACHINE>"
```

### 4. Announce it to other machines
```sh
node "AI Brain/scripts/brain.mjs" startup "<MACHINE>" \
  --agent "manual" --project "My Project" \
  --focus "Onboarding this machine" --cwd "$(pwd)"
node "AI Brain/scripts/brain.mjs" snapshot   # should show <MACHINE> as ACTIVE
```

### 5. Set up Claude Code (if you use it)
```sh
node "AI Brain/scripts/brain.mjs" install-claude-skills
node "AI Brain/scripts/brain.mjs" install-claude-hook
```
- First command copies the 4 `brain-*` skills into `~/.claude/skills/`.
- Second wires a SessionStart hook that auto-pulls the vault and re-installs updated skills every session — so you never manually re-sync again.
- **Start a fresh Claude Code session** for them to load.

### 6. Set up Codex (if you use it)
```sh
node "AI Brain/scripts/brain.mjs" codex-install "<MACHINE>"
```
Appends a canonical AI Brain block to `~/.codex/AGENTS.md`. **Restart Codex** to load it.

### 7. (Optional) Schedule the daily rollup
```sh
crontab -e
# add:
0 21 * * * cd ~/Obsidian-Vault && node "AI Brain/scripts/brain.mjs" daily "<MACHINE>" >> /tmp/brain-daily.log 2>&1
```

### 8. Commit your setup
```sh
git add "AI Brain/Machines/<MACHINE>"
git commit -m "Onboard <MACHINE> to the brain"
git push
```

### 9. Verify
```sh
node "AI Brain/scripts/brain.mjs" status     # lists machines + projects
node "AI Brain/scripts/brain.mjs" snapshot   # <MACHINE> = ACTIVE
```

### 10. (Optional) Open in Obsidian
**File → Open vault…** → select `~/Obsidian-Vault`. Enable the **Obsidian Git** community plugin for background auto-pull/commit. You don't need Obsidian (agents work against the filesystem directly), but it's a great GUI to browse and search memory.

---

## 🩹 Troubleshooting

- **`node`/`git: command not found`** — install them (`brew install node git` on macOS).
- **clone fails / "could not read from remote"** — fix GitHub access (SSH key or token), then retry.
- **"Missing machine name"** — you left the literal `<MACHINE>` in a command. Substitute your real name.
- **Slash commands don't fire in Claude Code** — you skipped Step 5 or didn't start a *new* session after it. Start fresh.
- **Slash commands don't fire in Codex** — you skipped Step 6 or didn't restart Codex.
- **Natural-language triggers don't fire** — expected; they're probabilistic. Use the slash commands.
- **git push rejected** — someone pushed first: `git pull --rebase` then `git push`.

---

For how the whole system works under the hood, see [`AI Brain/docs/`](AI%20Brain/docs/) and the [README](README.md).
