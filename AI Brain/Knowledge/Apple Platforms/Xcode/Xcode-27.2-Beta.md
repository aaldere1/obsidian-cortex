---
topic: Xcode 27.2 beta
category: xcode
status: BETA
verified: 2026-09-22
minimum_macos: macOS Tahoe 26.6
confidence: primary-source-verified
---

# Xcode 27.2 Beta

Xcode 27.2 beta (27B5019j) is a prerelease toolchain. Do not make production workflow assumptions from this page without re-checking the final Xcode 27.2 release.

## High-value change: JSON project configuration

Xcode 27.2 adds a JSON-based project configuration file format with the `.xcproj` extension inside the existing `.xcodeproj` project bundle.

Apple's stated goals are directly relevant to human and agent workflows:
- smaller, hierarchical, self-describing project configuration;
- easier source-control review;
- fewer merge conflicts because configuration changes are more isolated;
- easier editing by coding intelligence agents.

Xcode 27 and later can open the JSON project format. Existing projects can switch formats in the File inspector. The conversion replaces the internal `.pbxproj` project configuration file with `.xcproj` and can be reverted through source control.

## Agent guidance for `.xcproj`

Treat migration as a controlled repository change, not an automatic cleanup.

Before adopting:
1. Use a dedicated branch.
2. Capture a clean build/test baseline.
3. Convert the project format in Xcode 27.2 beta.
4. Inspect the complete source-control diff.
5. Verify CI, signing, schemes, package integration, generated-project tooling, and any scripts that parse `.pbxproj`.
6. Test agent-created project edits and merge-conflict behavior.
7. Keep the conversion reversible until the team accepts the workflow.

Do not hand-convert `.pbxproj` to JSON; use Xcode's supported conversion path.

## Agent/Preview tooling change

Xcode 27.2 beta resolves a Preview tooling limitation: the `RenderPreview` MCP tool now returns the available render destinations and allows the caller to choose a destination. Agents that validate UI through Xcode previews should prefer an explicit destination when device/layout differences matter.

## Important known issues

### Code completion crash on macOS 27.2 beta
Xcode may crash when using code completion on macOS 27.2 beta.

Apple's documented workaround is:

`defaults write com.apple.dt.Xcode CodeCompletionAssetsToLoad /dev/null`

Treat this as a beta-only workaround and remove/re-evaluate it when the issue is fixed.

### SDK deployment-target reporting
The macOS, watchOS, tvOS, and visionOS SDKs in Xcode 27.2 beta can incorrectly report 27.1 as a valid deployment target. Builds can behave unexpectedly when that target is selected. Mac Catalyst builds with 27.1 or 27.2 deployment targets can also be unable to use newly introduced API.

### Device Hub
- Keyboard and mouse input is not accepted by simulator runtimes earlier than iOS 18, tvOS 18, watchOS 11, or visionOS 2.
- A disconnected physical device can temporarily remain in hardware-keyboard mode for up to two minutes after using Simulate Hardware Keyboard.

## iPhone Duo toolchain split

Xcode 27.2 beta is not the iPhone Duo development branch. Apple explicitly directs developers to Xcode 27.1 beta for the Duo SDK and simulator.

Sources:
- https://developer.apple.com/documentation/xcode-release-notes/xcode-27_2-release-notes
- https://developer.apple.com/documentation/xcode/updating-your-xcode-project-configuration-file-format
- https://developer.apple.com/news/releases/
