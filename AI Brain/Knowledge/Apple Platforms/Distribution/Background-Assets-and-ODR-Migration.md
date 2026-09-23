---
topic: Background Assets and On-Demand Resources migration
category: distribution
status: SHIPPING
verified: 2026-09-23
confidence: primary-source-verified
---

# Background Assets and On-Demand Resources migration

## Current status

Apple has deprecated On-Demand Resources on iOS 27, iPadOS 27, tvOS 27, and visionOS 27. Apple states that existing On-Demand Resources continue to function in the near term, but support will be removed in a future release and recommends migrating to Background Assets.

`NSBundleResourceRequest` APIs are now documented as deprecated with the instruction to use Background Assets instead.

## Background Assets baseline

Managed Background Assets are available to apps targeting iOS 26, iPadOS 26, macOS 26, tvOS 26, and visionOS 26 or later.

Managed Background Assets can:
- automatically manage downloads and updates;
- perform streaming decompression;
- use self-hosted content or Apple hosting;
- deliver Apple-hosted asset packs separately from the app build through TestFlight and the App Store;
- update hosted content without requiring a new app version;
- support multiple asset packs and independently version those packs.

Apple Developer Program membership currently includes 200 GB of Apple-Hosted Background Assets per app or game.

## iOS 27-era additions

Starting with iOS 27, iPadOS 27, macOS 27, tvOS 27, and visionOS 27, Managed Background Assets can distribute localized asset packs separately from the app build. The system selects the most appropriate language pack based on system/app language preferences.

Devices on earlier OS versions do not receive localized asset packs.

## App Store Connect automation

Apple exposes App Store Connect API resources for Background Assets, including asset-pack records, versions, upload reservations/files, beta releases, App Store releases, and status/state inspection. This makes Background Asset packaging/release suitable for CI/CD automation rather than requiring the app binary to carry each content revision.

## Availability caution

Some newer individual Background Assets symbols are still marked Beta in current documentation. Do not assume every new symbol is shipping simply because the overall Background Assets system is shipping. Check availability on the exact API before generating production code.

## Agent guidance

When an existing project uses On-Demand Resources:
1. Inventory every ODR tag and the runtime code that requests/releases it.
2. Classify content by required-at-launch, prefetchable, optional, localized, and update-independent.
3. Design Background Asset packs around delivery/update boundaries rather than copying ODR tag structure mechanically.
4. Decide whether Apple-hosted or self-hosted delivery is appropriate.
5. Preserve a compatibility path for deployment targets that cannot use the chosen Background Assets API surface.
6. Test install, first launch, low-storage, interrupted-download, update, offline, and localization behavior.
7. Remove ODR only after migration behavior is verified on supported OS versions.

## Sources

- https://developer.apple.com/app-store/whats-new/
- https://developer.apple.com/help/app-store-connect/reference/app-uploads/on-demand-resources-size-limits
- https://developer.apple.com/help/app-store-connect/manage-asset-packs/overview-of-apple-hosted-asset-packs
- https://developer.apple.com/documentation/backgroundassets
- https://developer.apple.com/documentation/appstoreconnectapi/background-assets
- https://developer.apple.com/documentation/foundation/nsbundleresourcerequest
