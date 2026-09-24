# Current State

Last updated: 2026-09-24

- Verified Apple-platform intelligence corpus is active and agent-consumable.
- Current shipping baseline remains Xcode 27 / iOS 27.0 / Swift 6.4; App Store Connect API 4.5 shipped 2026-09-22.
- Xcode 27.1 beta remains the iPhone Duo development branch; iOS-family 27.2 beta 2 and Xcode 27.2 beta remain the latest tracked prerelease SDK/toolchain branch set.
- Xcode 27.2 beta's JSON `.xcproj` project configuration is tracked as a high-value agent/source-control workflow change, with migration explicitly gated to a controlled branch.
- Xcode agentic coding/MCP is modeled as a shipping workflow domain so development agents can consult the Apple AI Brain and then build/test/preview their work through Xcode.
- iOS/iPadOS 27.2's EU App Tracking Transparency changes remain tracked as BETA, including alternative/full-page prompt behavior and one-year re-prompt semantics.
- The expanded SwiftUI Document architecture remains tracked as a separate BETA domain with incremental/background I/O guidance.
- On-Demand Resources deprecation on iOS/iPadOS/tvOS/visionOS 27 is canonical, with Background Assets identified as Apple's replacement path and APPLE-017 covering migration work.
- App Store Connect/distribution knowledge tracks API 4.5, Asset Library/API guidance, the September 2026 social-media submission/age-range requirement, iOS 27 subscription multiseat/Bundles/Suites behavior, and the April 2027 SDK submission floor.
- APPLE-020 now covers auditing auto-renewable subscription multiseat defaults, StoreKit 2 readiness, Family Sharing interaction, and Bundle/Suite program fit.
- APPLE-021 now covers CI/toolchain preparation for Apple's April 2027 requirement that iOS/iPadOS/tvOS/visionOS/watchOS submissions use the corresponding 27 SDK or later.
- Swift Evolution watch now includes newly accepted SE-0548 (`resignRemoteID` for remote distributed actor references) and active-review SE-0553 (cheap process-local task identity for instrumentation), alongside SE-0547/0549/0550/0551/0552.
- The action register now contains APPLE-001 through APPLE-021.
- Every automated research run writes a dated durable run record even when no canonical change is required.
