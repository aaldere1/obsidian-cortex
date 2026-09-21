---
status: active
verified: 2026-09-21
---

# Source and Verification Policy

## Source priority
1. Apple Developer documentation, release notes, WWDC/Tech Talks, Swift.org.
2. Accepted Swift Evolution proposals and official repositories.
3. High-quality implementation examples and open-source projects.
4. Community articles only for patterns/examples, never to establish API availability.

## Permanent-ingest rules
A discovery enters the canonical knowledge base only when:
- it is relevant to app development;
- status and availability are known or explicitly marked unknown;
- at least one primary source verifies the core claim;
- older contradictory guidance is reconciled;
- there is a practical use/avoid/performance note.

## Freshness
- Release/toolchain baseline: verify daily during active release windows, otherwise weekly.
- Beta APIs: re-check on every beta or RC change that materially affects the topic.
- Shipping framework guidance: re-check at least every 90 days.
- Community recipes: re-check at least every 180 days or when underlying API changes.

## Never do
- Never treat a conference demo as a deployment guarantee without checking availability.
- Never convert a community benchmark into a universal performance claim.
- Never store copied articles or long transcripts; synthesize and link.
- Never use beta-only APIs in production action items without an explicit gate.
