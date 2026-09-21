---
topic: SwiftUI state and invalidation
category: swiftui
status: SHIPPING
verified: 2026-09-21
confidence: primary-source-verified
---

# State, Dependencies, and Over-Invalidation

SwiftUI performance is often dominated by how much of the tree is invalidated for a state change, not by the number of source lines in body.

## Preferred approach
- Keep state near the views that need it.
- With `@Observable`, let a view read only the properties it renders.
- Avoid broadly observed environment objects for high-frequency values when hundreds of descendants do not need every change.
- Keep expensive computation, sorting, formatting, and decoding out of body.

## Why this matters
Apple's 2026 performance lab calls over-invalidation a meaningful CPU and energy cost: views can be repeatedly rebuilt with no visible change.

## Diagnose
- SwiftUI Instruments for view update frequency.
- Time Profiler for heavy body work.
- Swift executors instrument when async work is occupying Main Actor.

Source:
- https://developer.apple.com/videos/play/wwdc2026/8003/
