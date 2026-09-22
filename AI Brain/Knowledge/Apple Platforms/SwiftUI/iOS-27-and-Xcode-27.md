---
topic: SwiftUI iOS 27 / Xcode 27
category: swiftui
status: SHIPPING
verified: 2026-09-22
minimum_os: iOS 27 for new runtime APIs
minimum_xcode: 27
confidence: primary-source-verified
---

# SwiftUI in iOS 27 / Xcode 27

Current public baseline: iOS 27.0 and Xcode 27 shipped 2026-09-14.

## Current beta branches
- Xcode 27.1 beta (27A9269), released 2026-09-18, is Apple's required branch for iPhone Duo SDK/simulator support.
- iOS/iPadOS/macOS/tvOS/visionOS 27.2 beta 2 released 2026-09-21.
- Xcode 27.2 beta includes Swift 6.4 and 27.2 SDKs. Its release notes explicitly say to use Xcode 27.1 beta for iPhone Duo support.

## High-value SwiftUI changes
- `AsyncImage` now uses standard HTTP caching on iOS 27+.
- `AsyncImage` can take a URLRequest and use a hierarchy-specific URLSession through `asyncImageURLSession`.
- `@State` builds through a new macro in Xcode 27; classes stored in State gain lazy initialization behavior described by Apple.
- `ContentBuilder`/ViewBuilder changes improve compile-time behavior.
- Reorderable container APIs extend drag reordering beyond List.
- `swipeActionsContainer` enables swipe actions in ScrollView-based layouts.
- Toolbar APIs include automatic/minimizing behavior driven by scrolling.

## Separate beta-only area
Apple's expanded SwiftUI Document architecture is currently documented as Beta. See [[Document-API]] rather than treating it as part of the shipping iOS 27 baseline.

## Tooling note
Xcode 27.2 beta release notes document a Device Hub limitation: keyboard/mouse input is not accepted for simulator runtimes earlier than iOS 18.0, tvOS 18.0, watchOS 11.0, and visionOS 2.0.

## Compatibility
New runtime APIs must be availability-gated when the deployment target is older than iOS 27. Toolchain/build-time improvements can benefit older deployment targets when documented as compiler behavior.

Sources:
- https://developer.apple.com/news/releases/
- https://developer.apple.com/news/
- https://developer.apple.com/swiftui/whats-new/
- https://developer.apple.com/videos/play/wwdc2026/269/
- https://developer.apple.com/documentation/swiftui/asyncimage
- https://developer.apple.com/documentation/xcode-release-notes/xcode-27_2-release-notes
