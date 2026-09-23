---
topic: App Store Connect API and current submission requirements
category: distribution
status: SHIPPING
verified: 2026-09-23
confidence: primary-source-verified
---

# App Store Connect API and current submission requirements

## App Store Connect API baseline

Apple released App Store Connect API 4.5 on 2026-09-22. Apple's releases page provides the current downloadable OpenAPI specification and release notes.

Agent guidance:
- Treat the OpenAPI specification as the machine-readable source of truth for generated clients.
- Pin generated clients/tooling to a known specification version and inspect the diff before regenerating production automation.
- Do not infer that a newly documented endpoint was introduced specifically in 4.5 unless the release notes/spec diff establishes that fact.
- Re-run integration tests for upload, TestFlight, metadata, review, subscription, and asset workflows after client regeneration.

## App Store creative assets

Apple's current App Store guidance says App Store assets can be submitted for approval through App Store Connect and through the App Store Connect API. Approved assets, including images, videos, app previews, and screenshots, are collected in Asset Library.

Asset Library is designed to let teams approve creative assets independently of an app-version submission and reuse them across App Store placements. Availability is rolling out during fall 2026, so agents must verify account/UI/API availability rather than assuming every account has the same rollout state.

## September 2026 social-media submission requirement

Apple states that beginning September 2026 developers must indicate whether an app or game includes social-media capabilities when submitting new versions or updates to the App Store, or when submitting for notarization for alternative marketplace distribution.

For apps that report social-media capabilities but disable them for users under 13, Apple's current guidance requires use of the Declared Age Range API at minimum to check users' age ranges. The app's age-rating questionnaire and behavior still determine the final rating and Time Allowance categorization.

## Agent guidance

Before changing distribution automation or App Store metadata:
1. Check the latest App Store Connect API release/version and OpenAPI spec.
2. Check App Store Connect release notes for TestFlight/submission changes.
3. Treat account-rollout features as availability-gated even when documentation exists.
4. For social/community/chat features, audit the current age-rating questionnaire, social-media declaration, Declared Age Range behavior, and alternative-marketplace notarization requirements.
5. Keep distribution/compliance changes separate from runtime feature work so they can be reviewed by product/legal owners where appropriate.

## Sources

- https://developer.apple.com/news/releases/
- https://developer.apple.com/documentation/appstoreconnectapi/app-store-connect-api-release-notes
- https://developer.apple.com/help/app-store-connect/release-notes/
- https://developer.apple.com/app-store/asset-best-practices/
- https://developer.apple.com/app-store/whats-new/
- https://developer.apple.com/wwdc26/guides/app-store/
