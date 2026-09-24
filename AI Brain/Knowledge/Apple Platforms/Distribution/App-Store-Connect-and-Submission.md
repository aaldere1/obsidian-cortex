---
topic: App Store Connect API and current submission requirements
category: distribution
status: SHIPPING
verified: 2026-09-24
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

## iOS 27 subscription purchase options

### Multiseat subscriptions

Apple has enabled multiseat-purchase configuration in App Store Connect for auto-renewable subscriptions. Current App Store Connect help says multiseat purchases are turned on by default for auto-renewable subscriptions, with an important exception: subscriptions created before 2026-09-14 that do not use StoreKit 2 or that have Family Sharing enabled are opted out by default.

Current behavior and rollout:
- App Store Connect lets teams choose whether an auto-renewable subscription can be purchased in quantities greater than one.
- Availability can be managed across the App Store, Apple Business, and Apple School Manager.
- Apple Business and Apple School Manager require multiseat to be allowed for subscription sales there.
- Volume Purchasing launches 2026-10-22.
- Group Purchases are planned for winter 2026.
- If both Family Sharing and multiseat are enabled, only the group purchaser's entitlement participates in Family Sharing; additional seats are individual-use entitlements.

Agent guidance:
- Audit purchase-option defaults rather than assuming a subscription is opted in or out.
- Do not change purchase-option availability automatically; changes can affect renewals, seat purchases, and store availability for existing customers.
- StoreKit 2 should be the baseline for current iOS 27 subscription work.

### Subscription Bundles and Suites

Apple's iOS 27 subscription program supports Bundles and Suites:
- A Bundle can package multiple auto-renewable subscriptions into one purchase, including multi-app and multi-developer configurations.
- A Suite provides one subscription across multiple apps from the same developer.
- Up to five subscriptions can participate in a Bundle.
- A Suite can span up to 15 apps.
- Multi-developer Bundles can include up to five developers.
- Purchase support requires iOS 27, iPadOS 27, macOS 27, or tvOS 27 or later and StoreKit 2.

Access is programmatic/managed rather than an assumption that every developer can immediately self-configure the feature: Apple asks interested developers to submit a request, and configurations are published in batches.

Agent guidance:
- Treat Bundles/Suites as a business/product capability requiring Apple approval/configuration, not a purely local StoreKit code change.
- Verify current account/program availability before implementation planning.
- For multi-developer Bundles, include legal/program coordination in the project plan rather than modeling it as only an engineering task.

## September 2026 social-media submission requirement

Apple states that beginning September 2026 developers must indicate whether an app or game includes social-media capabilities when submitting new versions or updates to the App Store, or when submitting for notarization for alternative marketplace distribution.

For apps that report social-media capabilities but disable them for users under 13, Apple's current guidance requires use of the Declared Age Range API at minimum to check users' age ranges. The app's age-rating questionnaire and behavior still determine the final rating and Time Allowance categorization.

## April 2027 SDK submission floor

Apple's current submission guidance says that starting in April 2027:
- iOS/iPadOS apps submitted to App Store Connect must be built with the iOS 27 / iPadOS 27 SDK or later;
- tvOS apps must use the tvOS 27 SDK or later;
- visionOS apps must use the visionOS 27 SDK or later;
- watchOS apps must use the watchOS 27 SDK or later.

Agent guidance:
- Treat this as an upcoming distribution gate, not a runtime deployment-target requirement.
- A project can continue to support older OS deployment targets while building with a newer SDK, subject to normal availability checks.
- CI/toolchain migrations should be completed and validated before April 2027 rather than deferred until submission is blocked.

## Agent guidance

Before changing distribution automation or App Store metadata:
1. Check the latest App Store Connect API release/version and OpenAPI spec.
2. Check App Store Connect release notes for TestFlight/submission changes.
3. Treat account-rollout features as availability-gated even when documentation exists.
4. For social/community/chat features, audit the current age-rating questionnaire, social-media declaration, Declared Age Range behavior, and alternative-marketplace notarization requirements.
5. For subscription apps, audit multiseat purchase options, StoreKit 2 use, Family Sharing interactions, and eligibility/program status for Bundles/Suites before changing product behavior.
6. Keep distribution/compliance changes separate from runtime feature work so they can be reviewed by product/legal owners where appropriate.
7. Track the April 2027 SDK submission floor in CI/toolchain planning.

## Sources

- https://developer.apple.com/news/releases/
- https://developer.apple.com/news/
- https://developer.apple.com/documentation/appstoreconnectapi/app-store-connect-api-release-notes
- https://developer.apple.com/help/app-store-connect/release-notes/
- https://developer.apple.com/app-store/asset-best-practices/
- https://developer.apple.com/app-store/whats-new/
- https://developer.apple.com/app-store/subscriptions/bundles-and-suites/
- https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-purchase-options-for-auto-renewable-subscriptions/
- https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/turn-on-family-sharing-for-in-app-purchases
- https://developer.apple.com/videos/play/wwdc2026/210/
- https://developer.apple.com/wwdc26/guides/app-store/
