---
name: brain-apple-dev-intelligence
description: Load the verified Apple-platform engineering brain for Swift, SwiftUI, Metal, shaders, Xcode/Instruments, iOS performance, adaptive layout, or Apple app-development work. Use before implementing, reviewing, optimizing, or creating action items for Apple-platform code.
---

# brain-apple-dev-intelligence

Use the AI Brain's current verified Apple-platform knowledge before relying on remembered framework behavior.

## Load order
1. Pull the vault with `git pull --ff-only`.
2. Read `AI Brain/Knowledge/Apple Platforms/INDEX.md`.
3. Read `AI Brain/Knowledge/Apple Platforms/Actions/ACTION-REGISTER.md`.
4. Read only the topic pages relevant to the task.
5. If the work targets a specific app/repo, read that project's AI Brain state and deployment constraints too.

## Rules
- Prefer current primary-source-verified brain knowledge over model recall.
- Check status and deployment gate for every newly introduced API.
- Never use BETA material as an unqualified production recommendation.
- Profile before adopting low-level Swift or GPU performance tricks.
- For performance fixes, state what tool/metric verifies success.
- For motion effects, include Reduce Motion/off-screen behavior.
- For new candidate work, use the handoff structure in `Agents/AGENT-HANDOFF.md`.
- If the user asks to create tasks for other agents, reference stable APPLE-### action IDs or add a new action to the register.

## Freshness
If the task depends on "latest", beta state, current Xcode/iOS release, or a recently changed API, verify the current primary source before implementing and update the brain if the canonical entry is stale.
