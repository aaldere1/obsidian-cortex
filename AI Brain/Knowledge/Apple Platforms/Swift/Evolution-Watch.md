---
topic: Swift Evolution Watch
category: swift
status: active
verified: 2026-09-24
confidence: primary-source-verified
---

# Swift Evolution Watch

Track active and recently accepted proposals with practical relevance to Apple app engineering. **Accepted does not mean shipping**: do not move an API into production guidance until its implementation/toolchain availability is verified for the targeted environment.

## SE-0548 — resignRemoteID for remote distributed actor references
Status: **ACCEPTED** on 2026-09-23; implementation/toolchain shipping status not yet promoted here.

Purpose: add `DistributedActorSystem.resignRemoteID(_:)`, invoked when a remote distributed actor proxy is deinitialized. This closes the remote-reference lifecycle gap between `resolve(id:as:)` and deinitialization so custom actor systems can release connection/resource accounting when the last relevant remote reference disappears.

Compatibility notes:
- The new protocol requirement has a default implementation, preserving source/ABI compatibility for existing actor-system implementations.
- The proposal states the emitted call is back-deployment-compatible; on older runtimes that do not support the requirement, the call is simply not made.
- `resignRemoteID(_:)` may be called multiple times for the same actor ID when multiple remote references were created from repeated resolves.

Agent guidance:
- Do not assume the API is available in the currently shipping Swift 6.4 toolchain solely because the proposal is accepted.
- For custom `DistributedActorSystem` implementations that retain resources per remote reference, re-check toolchain implementation availability before adopting.
- Keep `resignID(_:)` handling for local actors separate from `resignRemoteID(_:)` handling for remote proxies.

Sources:
- https://github.com/swiftlang/swift-evolution/blob/main/proposals/0548-resign-remote-id.md
- https://forums.swift.org/t/accepted-se-0548-resignremoteid-for-remote-distributed-actor-references/89703

## SE-0553 — Task Identity
Status: active review from 2026-09-23 through 2026-10-07.

Purpose: expose a cheap, stable, process-unique identifier for Swift concurrency tasks through proposed APIs including `Task.currentID`, `Task.id`, `UnsafeCurrentTask.id`, and the opaque `Task.ID` / `TaskID` value type.

The proposal is aimed primarily at always-on tracing, structured logging, profilers, custom executors, and other hot-path instrumentation where current `withUnsafeCurrentTask`-based identity workarounds can be too expensive or rely on unsupported pointer assumptions.

Proposed semantic guarantees include:
- process-unique for live tasks;
- never reused within a process;
- stable for the task lifetime;
- not meaningful as a cross-process identity.

Agent guidance:
- Treat as PROPOSED only while review is active.
- Do not replace production tracing/task-correlation code with `Task.currentID` until the proposal is accepted and the targeted toolchain/runtime availability is verified.
- If it ships, prefer the opaque `Task.ID` for in-process identity and use `rawValue` only for explicit serialization/logging schemas.
- Do not use task IDs as a substitute for distributed trace/span IDs across processes or hosts.
- Re-profile before enabling per-event task tagging in a hot path; the proposal's benchmark envelope is not a universal application-performance guarantee.

Sources:
- https://github.com/swiftlang/swift-evolution/blob/main/proposals/0553-task-identity.md
- https://forums.swift.org/t/se-0553-task-identity/89728

## SE-0551 — Span over a single value
Status: active review from 2026-09-22 through 2026-10-06.

Purpose: add `Span(ofOne:)`, `MutableSpan(ofOne:)`, `RawSpan(bytesOf:)`, and `MutableRawSpan(bytesOf:)` so code can borrow or mutate a single value in place without creating a copy-only adapter such as `CollectionOfOne`.

The proposal also positions these initializers as safer lifetime-aware alternatives to common `withUnsafePointer` / `withUnsafeBytes` patterns when adapting a single value to Span-taking APIs.

Agent guidance:
- Treat as PROPOSED only until accepted and available in the targeted toolchain/runtime.
- If it ships, prefer it in low-level parser/serializer/interoperability code when a Span-taking API must view exactly one value or that value's bytes.
- Do not introduce Span ownership/lifetime complexity into ordinary app code without a measured or API-design reason.

Sources:
- https://github.com/swiftlang/swift-evolution/blob/main/proposals/0551-span-of-one.md
- https://forums.swift.org/t/se-0551-span-over-a-single-value/89715

## SE-0552 — Rounding of Float.pi
Status: active review from 2026-09-22 through 2026-10-06.

Purpose: change `FloatingPoint.pi` semantics so it is no longer required to round toward zero, and specifically change `Float.pi` from the representable value just below π to the nearest representable value just above π, aligning with current IEEE 754 guidance.

Compatibility note: code or persisted/tested numeric output that depends on the exact historical `Float.pi` bit pattern could change if this proposal is accepted and implemented.

Agent guidance:
- Treat as PROPOSED only.
- For numerically sensitive code with exact expected values, golden files, binary protocols, hashes, or deterministic cross-version tests, avoid assuming the historical `Float.pi` bit pattern is permanent.
- If exact historical behavior is required, use an explicit literal/bit pattern rather than relying on `Float.pi` after this change ships.

Sources:
- https://github.com/swiftlang/swift-evolution/blob/main/proposals/0552-float-pi-rounding.md
- https://forums.swift.org/t/se-0552-rounding-of-float-pi/89716

## SE-0550 — @noSanitize attribute for functions
Status: review in progress through 2026-09-30.

Purpose: allow sanitizers to be disabled for selected functions. This is a specialized low-level/debugging capability and is not an app-level optimization technique.

Agent guidance:
- Do not recommend or use this as a general performance fix.
- If accepted later, it may matter for specialized interoperability/runtime code where sanitizer instrumentation is known to be incompatible.
- Re-check after review closes.

Sources:
- https://github.com/swiftlang/swift-evolution/blob/main/proposals/0550-nosanitize-attribute.md
- https://forums.swift.org/t/se-0550-nosanitize-attribute-for-functions/89593

## SE-0549 — SwiftPM HTTP Proxy Configuration
Status: review in progress through 2026-09-28.

Purpose: add cross-platform proxy configuration for Swift Package Manager HTTP operations, covering areas such as binary artifact downloads, package registries, package collections, OCSP validation, and Swift SDK downloads.

The proposal includes environment-variable support plus user/project configuration and explicitly does not change git's own proxy configuration.

Agent guidance:
- Treat this as PROPOSED only; do not generate production setup instructions that assume the commands/configuration exist in a shipping SwiftPM.
- Re-check after the review closes and after any accepted design changes.
- If it ships, it may materially simplify Xcode/CI use behind corporate proxies and firewalls.

Sources:
- https://github.com/swiftlang/swift-evolution/blob/main/proposals/0549-swiftpm-proxy-configuration.md
- https://forums.swift.org/t/review-se-0549-package-manager-http-proxy-configuration/89513

## SE-0547 — SwiftPM Compilation Caching
Status: proposal file still reports Active Review as of 2026-09-24; its stated review window ended 2026-09-01. No final acceptance/rejection announcement was verified in this pass.

Purpose: expose Swift/Clang content-addressable compilation caching through SwiftPM for repeated local, worktree, and CI builds.

Agent guidance:
- Do not treat the proposal's commands or configuration as shipping until a final decision and implementation status are verified.
- The proposal is performance-relevant, but benchmark claims belong to the proposal's tested workloads and are not universal app-build guarantees.
- Re-check before recommending build-cache adoption.

Sources:
- https://github.com/swiftlang/swift-evolution/blob/main/proposals/0547-swiftpm-compilation-caching.md
- https://forums.swift.org/t/se-0547-swiftpm-support-for-compilation-caching/89191

## Deployment-target conditional compilation
A 2026 pitch proposes compile-time conditions based on the minimum deployment target, distinct from runtime `#available`.

Agent guidance:
- Treat as exploratory/proposed until an accepted Swift Evolution proposal/toolchain implementation exists.
- Do not base production architecture on it.

Source:
- Swift Forums pitch discussed in late August/September 2026.
