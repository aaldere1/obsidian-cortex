---
topic: Swift concurrency and Observation
category: swift
status: SHIPPING
verified: 2026-09-21
confidence: primary-source-verified
---

# Concurrency and Observation

## Observation
Swift 6.4 adds fine-grained and continuous change notifications for `@Observable` types. This makes Observation useful beyond SwiftUI invalidation for synchronization, middleware, diagnostics, and targeted state pipelines.

For ordinary SwiftUI views, still prefer simply reading the `@Observable` properties the view renders. Avoid rebuilding Combine-style infrastructure when SwiftUI's automatic dependency tracking is sufficient.

## Main Actor rule
An `async` function or task is not automatically off the Main Actor. Work can inherit actor context. Xcode 27's Swift executors instrument can reveal long tasks occupying Main Actor.

### Move work off Main Actor when
- image processing/thumbnail rendering;
- parsing or transformation that takes meaningful CPU;
- synchronous file I/O;
- expensive formatting performed in bulk.

### Do not scatter tiny task hops
Apple performance guidance favors batching meaningful work rather than bouncing repeatedly between executors.

## Cleanup
Swift 6.4 supports async work in `defer`, and cancellation shields for cleanup that must complete.

Sources:
- https://www.swift.org/blog/swift-6.4-released/
- https://developer.apple.com/videos/play/wwdc2026/268/
- https://developer.apple.com/videos/play/wwdc2026/8003/
