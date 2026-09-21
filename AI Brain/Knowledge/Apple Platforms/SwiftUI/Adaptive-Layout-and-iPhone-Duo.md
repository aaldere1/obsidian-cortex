---
topic: Adaptive layout and iPhone Duo
category: swiftui
status: BETA
verified: 2026-09-21
minimum_os: iOS 27.1
minimum_xcode: Xcode 27.1 beta
confidence: primary-source-verified
---

# Adaptive Layout and iPhone Duo

As of 2026-09-21, iPhone Duo support is in the iOS 27.1/Xcode 27.1 beta cycle. Apple says the device becomes available 2026-10-23.

## New model
- `ArrangementView` arranges primary and secondary content using split/overlay strategies.
- `GeometryProxy.reservedRegions(kind:)` exposes hardware division/occlusion regions such as hinge/cameras.
- Toolbar items can express axis behavior such as `.verticalPreferred` and `.horizontalOnly`.

## Architectural lesson that applies beyond Duo
Avoid hard-coding portrait/landscape or symmetrical safe areas. Prefer container size, size classes, system containers, and region-aware layout.

## Gate
Do not introduce ArrangementView or Duo-specific APIs into a shipping production path until the app intentionally adopts iOS 27.1 SDK/API availability and beta risk is cleared.

Sources:
- https://developer.apple.com/news/
- https://developer.apple.com/videos/play/tech-talks/111463/
- https://developer.apple.com/videos/play/tech-talks/111462/
- https://developer.apple.com/documentation/updates/swiftui
