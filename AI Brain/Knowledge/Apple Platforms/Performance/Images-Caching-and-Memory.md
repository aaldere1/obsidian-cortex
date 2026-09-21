---
topic: Images, caching, and memory
category: performance
status: SHIPPING
verified: 2026-09-21
confidence: primary-source-verified
---

# Images, Caching, and Memory

## AsyncImage on iOS 27+
AsyncImage follows standard HTTP caching and server cache headers. For control:
- provide a custom URLRequest/cache policy;
- provide a hierarchy-specific URLSession using `asyncImageURLSession`;
- configure URLCache where appropriate.

## Decode size still matters
Displaying a huge decoded bitmap in a small SwiftUI frame does not erase the decode/memory cost. For thumbnail-heavy screens, decode/downsample to an appropriate target size rather than loading full-resolution assets into memory.

## Agent checklist
- Target size in pixels = points × display scale.
- Perform expensive decode/transform work off Main Actor.
- Cache by source identity plus target pixel dimensions when several display sizes exist.
- Avoid one full-resolution decoded image serving every thumbnail size unless measurement proves acceptable.
- Use standard HTTP caching before inventing a redundant network cache.

Sources:
- https://developer.apple.com/documentation/swiftui/asyncimage
- https://developer.apple.com/documentation/imageio/cgimagesourcecreatethumbnailatindex
- https://developer.apple.com/videos/play/wwdc2026/8003/
