# Current State

Last updated: 2026-09-22

- Verified Apple-platform intelligence corpus is active and agent-consumable.
- Current shipping baseline remains Xcode 27 / iOS 27.0 / Swift 6.4.
- Xcode 27.1 beta remains the iPhone Duo development branch; iOS-family 27.2 beta 2 and Xcode 27.2 beta are tracked separately.
- Xcode 27.2 beta's JSON `.xcproj` project configuration is now tracked as a high-value agent/source-control workflow change, with migration explicitly gated to a controlled branch.
- Xcode agentic coding/MCP is now modeled as a shipping workflow domain so development agents can be instructed to consult the Apple AI Brain and then build/test/preview their work through Xcode.
- iOS/iPadOS 27.2's EU App Tracking Transparency changes are tracked as BETA, including the alternative/full-page prompt behavior and one-year re-prompt rule.
- The expanded SwiftUI Document architecture remains tracked as a separate BETA domain with incremental/background I/O guidance.
- Swift Evolution watch now includes current SwiftPM proxy configuration and compilation-cache status alongside SE-0550 without treating proposals as shipping.
- The action register now contains APPLE-001 through APPLE-016, including new actions for `.xcproj`, EU ATT testing, and AI Brain-aware Xcode agent workflows.
- Every automated research run writes a dated durable run record even when no canonical change is required.
