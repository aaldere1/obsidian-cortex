---
topic: SwiftUI iOS 27 / Xcode 27
category: swiftui
status: SHIPPING
verified: 2026-09-21
minimum_os: iOS 27 for new runtime APIs
minimum_xcode: 27
confidence: primary-source-verified
---

# SwiftUI in iOS 27 / Xcode 27

Current public baseline: iOS 27.0 and Xcode 27 shipped 2026-09-14.

## High-value SwiftUI changes
- `AsyncImage` now uses standard HTTP caching on iOS 27+.
- `AsyncImage` can take a URLRequest and use a hierarchy-specific URLSession through `asyncImageURLSession`.
- `@State` builds through a new macro in Xcode 27; classes stored in State gain lazy initialization behavior described by Apple.
- `ContentBuilder`/ViewBuilder changes improve compile-time behavior.
- Reorderable container APIs extend drag reordering beyond List.
- `swipeActionsContainer` enables swipe actions in ScrollView-based layouts.
- Toolbar APIs include automatic/minimizing behavior driven by scrolling.

## Compatibility
New runtime APIs must be availability-gated when the deployment target is older than iOS 27. Toolchain/build-time improvements can benefit older deployment targets when documented as compiler behavior.

Sources:
- https://developer.apple.com/news/releases/
- https://developer.apple.com/swiftui/whats-new/
- https://developer.apple.com/videos/play/wwdc2026/269/
- https://developer.apple.com/documentation/swiftui/asyncimage
