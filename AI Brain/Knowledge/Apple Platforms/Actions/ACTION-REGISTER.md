---
status: active
verified: 2026-09-22
---

# Apple Platform Engineering Action Register

These are candidate actions for app-development agents. They are not automatically applied to an app repo.

## APPLE-001 — Profile the heaviest scrolling screen
- Status: ready
- Priority: P0
- Trigger: any app with reported scrolling hitch/jank
- Action: capture Release trace using Instruments 27; inspect SwiftUI updates, Time Profiler, and Swift executors.
- Acceptance: identify top verified bottleneck and capture before/after measurement.
- Knowledge: [[../Performance/Instruments-and-Main-Actor]]

## APPLE-002 — Audit lazy-stack row lifecycle
- Status: ready
- Priority: P0
- Trigger: large ScrollView + LazyVStack/LazyHStack
- Action: move essential row setup out of onAppear; move durable state to model/binding; pre-filter data before ForEach; remove layout-changing geometry feedback where possible.
- Acceptance: rows remain correct after off-screen destruction and programmatic scrolling no longer shifts due to post-appearance layout.
- Knowledge: [[../SwiftUI/Lazy-Stacks-and-Scrolling]]

## APPLE-003 — Audit image decode and thumbnail strategy
- Status: ready
- Priority: P0
- Trigger: remote/local high-resolution images shown as small thumbnails
- Action: downsample at decode to target pixel size; perform decode off Main Actor; cache by source + target size.
- Acceptance: lower memory/decode CPU without visible quality regression at target size.
- Knowledge: [[../Performance/Images-Caching-and-Memory]]

## APPLE-004 — Adopt iOS 27 AsyncImage caching where applicable
- Status: ready
- Priority: P1
- Deployment gate: iOS 27+
- Trigger: custom remote image networking/caching exists only to compensate for older AsyncImage behavior
- Action: evaluate standard caching, custom URLRequest policy, and asyncImageURLSession before retaining bespoke network-cache code.
- Acceptance: no regression in cache correctness/offline behavior; duplicate caching layers removed where unnecessary.
- Knowledge: [[../SwiftUI/iOS-27-and-Xcode-27]]

## APPLE-005 — Prewarm important SwiftUI shaders
- Status: ready
- Priority: P1
- Trigger: first activation of a shader/transition visibly hitches
- Action: use Shader.compile(as:) before the first critical interaction.
- Acceptance: first-run effect no longer includes shader compilation stall in profiling.
- Knowledge: [[../Shaders/SwiftUI-Shader-API]]

## APPLE-006 — Add dither to smooth procedural shader fills
- Status: ready
- Priority: P2
- Trigger: visible banding in smooth shader-generated gradients
- Action: test Shader.dithersColor.
- Acceptance: reduced banding with acceptable GPU/output cost.
- Knowledge: [[../Shaders/SwiftUI-Shader-API]]

## APPLE-007 — Candidate: domain-warp hero/background
- Status: proposed
- Priority: P2
- Trigger: feature needs subtle premium ambient motion
- Action: prototype WWDC26-style noise/domain-warp layerEffect driven by TimelineView.
- Acceptance: stable frame pacing on target devices; motion stops when off-screen; Reduce Motion fallback.
- Knowledge: [[../Shaders/Recipes]]

## APPLE-008 — Reduce broad state invalidation
- Status: ready
- Priority: P0
- Trigger: frequently changing global/environment model or excessive body updates
- Action: narrow observation dependencies and isolate state to the views that render it.
- Acceptance: SwiftUI Instruments shows fewer irrelevant updates.
- Knowledge: [[../SwiftUI/State-and-Invalidation]]

## APPLE-009 — Add production performance context
- Status: proposed
- Priority: P1
- Trigger: mature app where local profiling cannot explain field regressions
- Action: evaluate MetricKit + StateReporting with low-cardinality product-state labels.
- Acceptance: shipped metrics can distinguish performance by meaningful app mode.
- Knowledge: [[../Performance/MetricKit-and-Production-Metrics]]

## APPLE-010 — Define shader/full-Metal boundary
- Status: ready
- Priority: P1
- Trigger: effect is growing into particles/simulation/multi-pass renderer
- Action: stop modeling independent particles as SwiftUI views or a single giant layerEffect; move geometry/simulation to Metal renderer.
- Acceptance: clear renderer ownership boundary; SwiftUI stays orchestration/UI.
- Knowledge: [[../Shaders/SwiftUI-Shader-API]], [[../Metal/Metal-4]]

## APPLE-011 — Evaluate Swift 6.4 ownership primitives only after profiling
- Status: proposed
- Priority: P3
- Trigger: measured allocations/copies or generic hot paths in processing code
- Action: evaluate UniqueArray/UniqueBox/Iterable/borrow-mutate or specialization.
- Acceptance: verified improvement in Release trace; no unjustified complexity.
- Knowledge: [[../Swift/Performance-Primitives]]

## APPLE-012 — Prepare adaptive primary/secondary layout for Duo
- Status: blocked
- Priority: P2
- Deployment gate: iOS 27.1 / Xcode 27.1; currently beta 2026-09-22
- Trigger: app has a meaningful player/detail + secondary-list layout or targets iPhone Duo
- Action: prototype ArrangementView and reserved regions on a beta branch.
- Acceptance: no production dependency before API/SDK gate is approved.
- Knowledge: [[../SwiftUI/Adaptive-Layout-and-iPhone-Duo]]

## APPLE-013 — Evaluate the new SwiftUI Document architecture
- Status: blocked
- Priority: P1
- Deployment gate: API is currently documented as Beta as of 2026-09-22
- Trigger: document-based app, editor, creative tool, or package format with expensive reads/writes
- Action: prototype ReadableDocument/WritableDocument + DocumentReader/DocumentWriter; keep snapshot/apply lightweight on Main Actor; move serialization and disk I/O to the provided background path; use previous snapshots for incremental writes.
- Acceptance: beta branch demonstrates lower main-thread I/O cost and correct autosave/undo behavior, with no production dependency until API status is cleared.
- Knowledge: [[../SwiftUI/Document-API]]

## APPLE-014 — Pilot Xcode JSON project configuration
- Status: blocked
- Priority: P1
- Target: generic / agent-heavy Xcode projects
- Deployment gate: conversion UI is in Xcode 27.2 beta; `.xcproj` is compatible with Xcode 27+
- Trigger: project-file merge conflicts, frequent automated project edits, or coding agents that need to modify Xcode project configuration
- Action: on a dedicated branch, convert the internal project configuration from `.pbxproj` to Xcode's JSON `.xcproj` format using Xcode; inspect the full diff; then build, test, sign, and exercise CI/project-generation tooling.
- Acceptance: no build/test/signing/CI regression; source-control diffs are intelligible; agent project edits succeed; rollback to `.pbxproj` is proven.
- Performance verification: compare merge-conflict/diff quality and agent edit reliability rather than runtime performance.
- Sources: https://developer.apple.com/documentation/xcode/updating-your-xcode-project-configuration-file-format ; https://developer.apple.com/documentation/xcode-release-notes/xcode-27_2-release-notes
- Knowledge: [[../Xcode/Xcode-27.2-Beta]]

## APPLE-015 — Audit iOS 27.2 ATT behavior in the EU
- Status: blocked
- Priority: P1
- Target: apps that use ATT, advertising attribution, or cross-company tracking
- Deployment gate: iOS/iPadOS 27.2 is currently beta
- Trigger: app requests ATT permission or ships an SDK/use case that falls within Apple's tracking definition
- Action: test the alternative EU ATT prompt, the full-page flow required in Germany/France/Italy/Poland/Romania, purpose strings/markdown description, Additional Information path, and one-year re-prompt semantics.
- Acceptance: product/legal copy is reviewed; supported EU flows are verified on beta; no custom logic bypasses system ATT state; final 27.2 behavior is re-verified before production rollout.
- Performance verification: not applicable; verify privacy/compliance behavior and UX correctness.
- Sources: https://developer.apple.com/app-store/user-privacy-and-data-use/ ; https://developer.apple.com/documentation/apptrackingtransparency/attrackingmanager/requesttrackingauthorization(completionhandler:)
- Knowledge: [[../Privacy/App-Tracking-Transparency-iOS-27.2]]

## APPLE-016 — Wire Apple AI Brain context into Xcode agent workflows
- Status: ready
- Priority: P1
- Target: teams using Codex, Claude Agent, Gemini, or other MCP-compatible agents with Xcode
- Deployment gate: Xcode agentic coding ships in Xcode 26.3+; current workflow guidance verified for Xcode 27
- Trigger: an agent is allowed to make Apple-platform implementation changes
- Action: configure the agent workflow so Apple-platform tasks consult `AI Brain/Knowledge/Apple Platforms/INDEX.md`, the relevant topic pages, and `Actions/ACTION-REGISTER.md` before implementation; preserve Xcode build/test/preview verification and least-privilege command/tool permissions.
- Acceptance: a representative agent task reads the brain context, respects SHIPPING/BETA/PROPOSED gates, builds/tests the change, uses previews where relevant, and reports verification plus unresolved risks.
- Performance verification: for performance tasks, require Instruments evidence before and after; otherwise use build/test/preview validation.
- Sources: https://developer.apple.com/documentation/xcode/extending-and-customizing-agents ; https://developer.apple.com/videos/play/tech-talks/111428/ ; https://developer.apple.com/videos/play/wwdc2026/259/
- Knowledge: [[../Xcode/Agentic-Coding-and-MCP]]
