---
status: active
verified: 2026-09-22
---

# Automatic Intelligence Update Protocol

This knowledge domain is maintained by a recurring research agent.

## Non-negotiable persistence rule

**Every research run writes to the AI Brain.** Even when nothing materially changes, the run must create a dated record under `Updates/`.

A run record must include:
- run date/time;
- release/beta status checked;
- findings reviewed;
- items confirmed unchanged;
- sources consulted;
- whether each finding changed canonical knowledge or an action item.

This provides a complete, inspectable audit trail without forcing duplicate facts into canonical topic pages.

## Research loop
1. Search current Apple Developer release notes, SwiftUI updates, WWDC/Tech Talks, Swift.org, Swift Evolution, and selective high-quality community implementations.
2. Compare findings with existing pages.
3. Reject unsupported claims and duplicates from canonical pages, but still record that they were reviewed in the dated run record when relevant.
4. Always write the dated run record under `Updates/`.
5. For meaningful new or changed information:
   - update the canonical topic page;
   - update INDEX.md when a new topic exists;
   - add/update an item in Actions/ACTION-REGISTER.md when there is practical engineering value;
   - add/update recipes when an implementation pattern is reusable;
   - update the Apple-Platform-Intelligence project Current State when the domain materially changes;
   - mark superseded material explicitly instead of silently deleting historical context.
6. Notify the user only for meaningful changes. A no-change run is still persisted, but need not produce a notification.

## Canonical-vs-run-log rule

- `Updates/` = complete chronological record of what was checked and found on each run.
- Topic pages = current canonical engineering truth.
- `Actions/ACTION-REGISTER.md` = implementation-ready candidate work for agents.
- Do not copy the same unchanged fact into new topic pages on every run.

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
- Beta/proposed material must remain explicitly gated until status changes are verified.
