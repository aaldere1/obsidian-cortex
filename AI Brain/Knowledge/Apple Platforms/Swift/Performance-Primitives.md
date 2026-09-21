---
topic: Swift performance primitives
category: swift
status: SHIPPING
verified: 2026-09-21
confidence: primary-source-verified
---

# Swift Performance Primitives

These are surgical tools, not default architecture.

## UniqueArray
Use when a hot path needs dynamically sized storage for noncopyable elements or when Array copy-on-write allocations are proven material.

## UniqueBox
Unique heap ownership without reference counting. Useful for ownership-sensitive systems code or large values when ARC overhead/copy semantics are demonstrated bottlenecks.

## Ref / MutableRef
Storable containers designed around borrowing/mutating one value at a time.

## Iterable
Enables borrowing iteration, extending beyond Sequence where copying elements is undesirable.

## @inline(always) and @specialized
Use only for measured hot code. Forcing specialization/inlining can grow binaries and reduce optimizer flexibility.

## Verification checklist
Before adoption:
- Release build.
- Time Profiler.
- Allocation/copy evidence.
- Before/after trace.
- Binary-size check where optimizer controls are used.

Sources:
- https://www.swift.org/blog/swift-6.4-released/
- https://developer.apple.com/videos/play/wwdc2026/262/
