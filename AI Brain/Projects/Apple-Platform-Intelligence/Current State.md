# Current State

Last updated: 2026-09-23

- Verified Apple-platform intelligence corpus is active and agent-consumable.
- Current shipping baseline remains Xcode 27 / iOS 27.0 / Swift 6.4; App Store Connect API 4.5 shipped 2026-09-22.
- Xcode 27.1 beta remains the iPhone Duo development branch; iOS-family 27.2 beta 2 and Xcode 27.2 beta are tracked separately.
- Xcode 27.2 beta's JSON `.xcproj` project configuration is tracked as a high-value agent/source-control workflow change, with migration explicitly gated to a controlled branch.
- Xcode agentic coding/MCP is modeled as a shipping workflow domain so development agents can consult the Apple AI Brain and then build/test/preview their work through Xcode.
- iOS/iPadOS 27.2's EU App Tracking Transparency changes remain tracked as BETA, including alternative/full-page prompt behavior and one-year re-prompt semantics.
- The expanded SwiftUI Document architecture remains tracked as a separate BETA domain with incremental/background I/O guidance.
- On-Demand Resources deprecation on iOS/iPadOS/tvOS/visionOS 27 is now canonical, with Background Assets identified as Apple's replacement path and APPLE-017 added for migration work.
- App Store Connect/distribution knowledge now tracks API 4.5, current Asset Library/API guidance, and the September 2026 social-media submission/age-range requirement.
- Swift Evolution watch now includes SE-0551 (`Span` over one value) and SE-0552 (`Float.pi` rounding), both in active review through 2026-10-06, alongside SE-0547/0549/0550.
- The action register now contains APPLE-001 through APPLE-019.
- Every automated research run writes a dated durable run record even when no canonical change is required.
