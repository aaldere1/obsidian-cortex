---
topic: Swift Evolution Watch
category: swift
status: PROPOSED
verified: 2026-09-22
confidence: primary-source-verified
---

# Swift Evolution Watch

Track active proposals/pitches with practical relevance to Apple app engineering. Nothing on this page is shipping unless moved into a shipping topic page.

## SE-0550 — @noSanitize attribute for functions
Status: review in progress through 2026-09-30.

Purpose: allow sanitizers to be disabled for selected functions. This is a specialized low-level/debugging capability and is not an app-level optimization technique.

Agent guidance:
- Do not recommend or use this as a general performance fix.
- If accepted later, it may matter for specialized interoperability/runtime code where sanitizer instrumentation is known to be incompatible.
- Re-check after review closes.

Source:
- https://forums.swift.org/t/se-0550-nosanitize-attribute-for-functions/89593

## Deployment-target conditional compilation
A 2026 pitch proposes compile-time conditions based on the minimum deployment target, distinct from runtime `#available`.

Agent guidance:
- Treat as exploratory/proposed until an accepted Swift Evolution proposal/toolchain implementation exists.
- Do not base production architecture on it.

Source:
- Swift Forums pitch discussed in late August/September 2026.
