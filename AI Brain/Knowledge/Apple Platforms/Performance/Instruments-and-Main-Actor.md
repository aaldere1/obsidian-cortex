---
topic: Instruments 27 responsiveness workflow
category: performance
status: SHIPPING
verified: 2026-09-21
minimum_xcode: 27
confidence: primary-source-verified
---

# Instruments, Main Actor, and Responsiveness

Apple's WWDC26 workflow is diagnostic rather than guess-driven.

## First rule
Profile an optimized/Release configuration. Debug behavior can distort performance conclusions.

## Diagnostic flow
1. Reproduce the hitch/hang.
2. Look at responsiveness markers and CPU.
3. If CPU/main thread is busy, use Time Profiler to find expensive stacks.
4. Use the Swift executors instrument to see Main Actor/global/custom executor activity and actor contention.
5. If CPU is mostly idle during the stall, investigate I/O, locks, IPC, and scheduling with appropriate system tracing.

## Common SwiftUI failure
An async task launched from UI context can still execute CPU-heavy work on Main Actor through actor inheritance. Image processing, parsing, bulk transformation, or synchronous file I/O can then block scrolling.

## Verify
Always capture before/after traces. Xcode 27 supports comparison-oriented workflows; use measurement rather than perceived smoothness alone.

Source:
- https://developer.apple.com/videos/play/wwdc2026/268/
