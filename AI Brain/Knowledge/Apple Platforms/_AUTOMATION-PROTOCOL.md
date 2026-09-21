---
status: active
verified: 2026-09-21
---

# Automatic Intelligence Update Protocol

This knowledge domain is maintained by a recurring research agent.

## Research loop
1. Search current Apple Developer release notes, SwiftUI updates, WWDC/Tech Talks, Swift.org, Swift Evolution, and selective high-quality community implementations.
2. Compare findings with existing pages.
3. Reject duplicates and unverified claims.
4. For new or changed information:
   - update the canonical topic page;
   - update INDEX.md when a new topic exists;
   - add/update an item in Actions/ACTION-REGISTER.md when there is practical engineering value;
   - write a dated note under Updates/;
   - mark superseded material explicitly instead of silently deleting historical context.
5. Notify the user only for meaningful changes.

## Agent-action generation
Every actionable discovery should include:
- stable ID: APPLE-###
- status: proposed | ready | blocked | adopted | rejected | superseded
- priority: P0/P1/P2/P3
- target: generic or project/repo
- trigger: when it applies
- implementation outline
- acceptance criteria
- deployment/API gate
- performance verification method
- source links

## Safety
- No secrets.
- No automatic edits to an application repo merely because a new technique exists.
- Knowledge may create candidate actions; implementation agents decide fit against project constraints.
