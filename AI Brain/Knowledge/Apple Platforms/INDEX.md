---
knowledge_domain: apple-platform-development
status: active
verified: 2026-09-24
owners: [AI Brain]
source_policy: primary-first
---

# Apple Platform Engineering Intelligence

Canonical agent-facing knowledge for Swift, SwiftUI, Metal, SwiftUI shaders, Xcode/Instruments, distribution, privacy, and Apple-platform performance.

## Current shipping baseline

- Xcode 27 shipped 2026-09-14.
- iOS/iPadOS/macOS/tvOS/visionOS/watchOS 27.0 shipped 2026-09-14.
- Swift 6.4 shipped 2026-09-15.
- App Store Connect API 4.5 shipped 2026-09-22.
- Xcode 27.1 beta (27A9269) shipped 2026-09-18 and is currently the required beta branch for iPhone Duo support.
- iOS/iPadOS/macOS/tvOS/visionOS/watchOS 27.2 beta 2 shipped 2026-09-21.
- Xcode 27.2 beta (27B5019j) is active, includes Swift 6.4 and 27.2 SDKs, but Apple directs Duo development to Xcode 27.1 beta.

## Upcoming distribution gates

- Starting April 2027, App Store Connect submissions for iOS/iPadOS, tvOS, visionOS, and watchOS must be built with the corresponding 27 SDK or later. This is an SDK/build-tool requirement, not a requirement to raise an app's deployment target to OS 27.
- Auto-renewable subscription purchase-option configuration now includes multiseat settings in App Store Connect; Volume Purchasing launches 2026-10-22 and Group Purchases are planned for winter 2026.

## Agent rule

Before implementing or diagnosing Apple-platform code:
1. Read this index.
2. Read the relevant topic pages.
3. Check `Actions/ACTION-REGISTER.md` for already identified engineering work.
4. Prefer a current, primary-source-verified API over recalled model knowledge.
5. Check deployment target and status before proposing an API.
6. Do not silently use beta-only APIs in production code.
7. Profile before applying micro-optimizations.
8. When using coding agents, preserve build/test/preview verification rather than trusting generated code without validation.
9. For distribution automation, verify current App Store Connect API/submission requirements before changing CI or metadata.
10. Treat accepted Swift Evolution proposals as non-shipping until implementation/toolchain availability is separately verified.

## Topic map

### Swift
- [[Swift/Swift-6.4]]
- [[Swift/Concurrency-and-Observation]]
- [[Swift/Performance-Primitives]]
- [[Swift/Evolution-Watch]]

### SwiftUI
- [[SwiftUI/iOS-27-and-Xcode-27]]
- [[SwiftUI/State-and-Invalidation]]
- [[SwiftUI/Lazy-Stacks-and-Scrolling]]
- [[SwiftUI/Adaptive-Layout-and-iPhone-Duo]]
- [[SwiftUI/Document-API]]

### Xcode and agents
- [[Xcode/Xcode-27.2-Beta]]
- [[Xcode/Agentic-Coding-and-MCP]]

### Distribution
- [[Distribution/Background-Assets-and-ODR-Migration]]
- [[Distribution/App-Store-Connect-and-Submission]]

### Privacy
- [[Privacy/App-Tracking-Transparency-iOS-27.2]]

### Shaders
- [[Shaders/SwiftUI-Shader-API]]
- [[Shaders/Recipes]]

### Metal
- [[Metal/Metal-4]]

### Performance
- [[Performance/Instruments-and-Main-Actor]]
- [[Performance/Images-Caching-and-Memory]]
- [[Performance/MetricKit-and-Production-Metrics]]

### Agent handoff
- [[Agents/AGENT-HANDOFF]]
- [[Actions/ACTION-REGISTER]]

## Status vocabulary

- **SHIPPING** — available in current public production SDK/toolchain.
- **BETA** — present only in beta SDK/OS or documented as beta.
- **PROPOSED** — proposal/discussion; do not implement as a shipping assumption.
- **COMMUNITY** — useful technique/library not guaranteed by Apple.
- **DEPRECATED** — supported but should not be chosen for new work.
- **SUPERSEDED** — replaced by newer guidance.

## Primary sources

- https://developer.apple.com/news/releases/
- https://developer.apple.com/news/
- https://developer.apple.com/documentation/xcode-release-notes/
- https://developer.apple.com/swiftui/whats-new/
- https://developer.apple.com/videos/wwdc2026/
- https://developer.apple.com/documentation/swiftui/shader
- https://developer.apple.com/wwdc26/guides/metal/
- https://developer.apple.com/app-store/whats-new/
- https://developer.apple.com/app-store/subscriptions/bundles-and-suites/
- https://developer.apple.com/documentation/backgroundassets
- https://developer.apple.com/documentation/appstoreconnectapi/
- https://developer.apple.com/app-store/user-privacy-and-data-use/
- https://www.swift.org/blog/swift-6.4-released/
- https://github.com/swiftlang/swift-evolution

See [[_SOURCE-POLICY]] and [[_AUTOMATION-PROTOCOL]].
