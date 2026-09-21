---
topic: Lazy stacks and scrolling
category: swiftui
status: SHIPPING
verified: 2026-09-21
confidence: primary-source-verified
---

# Lazy Stacks and Scrolling

WWDC26 documents important LazyVStack/LazyHStack internals.

## Key behavior
- Lazy stacks render only a subset of content and estimate off-screen sizes.
- They prefetch work before rows become visible to hit frame deadlines.
- Off-screen child views may eventually be destroyed.
- Programmatic scrolling relies on estimated positions for unseen content.

## Do
- Prepare row structure before `.onAppear` where possible so prefetching helps.
- Put durable row state in a model or parent binding.
- Keep row sizing reasonably predictable.
- Filter data before `ForEach`, rather than changing leaf subview counts conditionally.
- Use a custom Layout if a row otherwise needs geometry→state→second-layout feedback.

## Avoid
- Essential initialization only in `.onAppear`.
- Using absolute content size/offset as though lazy content were fully materialized.
- Changing row layout after appearance when precise scrolling matters.
- Dynamic leaf subview counts used as filtering.

Source:
- https://developer.apple.com/videos/play/wwdc2026/321/
