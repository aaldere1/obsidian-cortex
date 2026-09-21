---
topic: Swift 6.4
category: swift
status: SHIPPING
verified: 2026-09-21
minimum_xcode: 27
confidence: primary-source-verified
---

# Swift 6.4

Swift 6.4 shipped on 2026-09-15.

## High-value changes for app teams
- Fine-grained and continuous change notifications for `@Observable` types.
- Async work is allowed in `defer`.
- `withTaskCancellationShield` can protect essential cleanup.
- `@diagnose` adds source-level warning control.
- Module selectors (`Module::Type`) disambiguate colliding API names.
- SwiftPM now uses Swift Build by default.
- Swift Testing and XCTest interoperability improved.
- Foundation URL parsing has major performance improvements; Apple reports up to 4× in relevant cases.

## Performance-oriented additions
- Borrow/mutate accessors.
- `UniqueBox` and `UniqueArray`.
- `Iterable` for borrowing iteration over types including noncopyable values.
- `Ref` / `MutableRef`.
- Safe temporary allocation and raw-memory loading APIs.
- Optimizer controls discussed at WWDC26: `@inline(always)` and `@specialized`.

## Agent guidance
Use ordinary Swift first. Reach for ownership/noncopyable/optimizer controls only after profiling proves copying, allocation, generic dispatch, or hot-path overhead is material.

Sources:
- https://www.swift.org/blog/swift-6.4-released/
- https://developer.apple.com/videos/play/wwdc2026/262/
