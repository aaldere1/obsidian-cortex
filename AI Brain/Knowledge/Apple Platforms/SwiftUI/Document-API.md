---
topic: SwiftUI Document API
category: swiftui
status: BETA
verified: 2026-09-22
confidence: primary-source-verified
---

# SwiftUI Document API

Apple's expanded Document architecture is currently documented as **Beta** as of 2026-09-22. Do not assume production availability without checking the current SDK and deployment target.

## Architecture
- `Document` combines `ReadableDocument` and `WritableDocument`.
- Reading is separated into a `DocumentReader`.
- Writing is separated into a `DocumentWriter`.
- SwiftUI captures a snapshot on the main actor, then performs coordinated disk writing in the background.
- `DocumentWriter.write(...previous:progress:)` receives the previous snapshot so apps can avoid rewriting unchanged parts.
- `ReadableDocument.apply(snapshot:previous:)` returns to the main actor; Apple explicitly recommends keeping this lightweight and doing deserialization in the reader.
- Direct URL access and streaming writes are supported for custom writers.
- `DocumentCreationSource` and creation context support multiple document creation paths.

## Performance model
Use the main actor for:
- taking a lightweight document snapshot;
- applying already-decoded state to the observable model.

Use background/coordinated document infrastructure for:
- deserialization;
- serialization;
- disk I/O;
- incremental package writes;
- progress reporting.

## Practical pattern
For large package documents, compare the current and previous snapshot and write only changed resources instead of rewriting the full package.

## Important behavior
Autosave depends on undo registration for user-facing edits. Audit undo behavior when migrating.

## Agent rule
Use this architecture as a candidate for document-heavy apps, editors, creative tools, or large package-based formats. Keep it gated while the API remains Beta.

Sources:
- https://developer.apple.com/documentation/swiftui/document
- https://developer.apple.com/documentation/swiftui/documentwriter
- https://developer.apple.com/documentation/swiftui/writabledocument
- https://developer.apple.com/documentation/swiftui/updating-your-document-based-app
- https://developer.apple.com/videos/play/wwdc2026/269/
