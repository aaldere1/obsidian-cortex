---
topic: App Tracking Transparency in iOS/iPadOS 27.2
category: privacy
status: BETA
verified: 2026-09-22
minimum_os: iOS 27.2 / iPadOS 27.2
confidence: primary-source-verified
---

# App Tracking Transparency in iOS/iPadOS 27.2

Apple is changing the App Tracking Transparency (ATT) system prompt behavior in the European Union beginning with iOS 27.2 and iPadOS 27.2. Because these OS releases are currently beta, keep this material explicitly gated until the public release is verified.

## What changes

Developers in the EU can use an alternative ATT system prompt. The underlying requirement for when an app must request tracking permission does not change.

Due to legal requirements, only the alternative system prompt is available for apps distributed in:
- Germany
- France
- Italy
- Poland
- Romania

The alternative prompt uses different formatting/language and can include an `Additional Information` text button that lets the app surface more explanation about why it wants to link user/device data across companies for advertising, measurement, or data-broker sharing.

## Re-prompt behavior in the EU

For users in the European Union, an app can request ATT permission again one year after the user's previous ATT choice, regardless of whether the previous answer was allow or deny.

A re-prompt is not available when the user has globally disabled the setting that allows apps to request tracking/linking across companies.

## API behavior worth testing

Apple's documentation for `requestTrackingAuthorization` states that in France, Germany, Italy, Poland, and Romania the system presents a full-page sheet rather than the ordinary alert. If the app supplies `NSUserTrackingMarkdownUsageDescription`, the full-page sheet can display that rich-text explanation.

## Agent guidance

If an app uses ATT, advertising attribution, cross-company tracking, or an analytics/advertising SDK that falls within ATT scope:
1. Identify whether the app is distributed in the EU.
2. Test the iOS/iPadOS 27.2 ATT flow on a beta branch.
3. Validate the full-page experience in Germany, France, Italy, Poland, and Romania.
4. Review `NSUserTrackingUsageDescription` and, where applicable, `NSUserTrackingMarkdownUsageDescription`.
5. Verify product/legal copy and the optional Additional Information flow.
6. Test the one-year re-prompt logic conceptually, but do not invent custom bypasses around system ATT state.
7. Re-check final iOS/iPadOS 27.2 documentation before production rollout.

## Do not infer

- Do not treat the alternative prompt as eliminating ATT requirements.
- Do not assume the beta behavior is final until iOS/iPadOS 27.2 ships.
- Do not fingerprint users or replace ATT with another identifier-based tracking mechanism when permission is absent.

Sources:
- https://developer.apple.com/app-store/user-privacy-and-data-use/
- https://developer.apple.com/documentation/apptrackingtransparency/attrackingmanager/requesttrackingauthorization(completionhandler:)
- https://developer.apple.com/news/
