---
topic: MetricKit and StateReporting
category: performance
status: SHIPPING
verified: 2026-09-21
confidence: primary-source-verified
---

# Production Performance: MetricKit + StateReporting

WWDC26 introduces a redesigned MetricKit workflow with richer diagnostics and app-state context.

## Why use it
Local profiling finds reproducible issues. MetricKit helps detect problems that occur in real-world sessions/devices.

## Useful pattern
Define meaningful application states (for example: gallery.scrolling, editor.exporting, playback.fullscreen) and correlate performance metrics/diagnostics to those states via StateReporting.

## Track
- launch/responsiveness;
- hangs;
- CPU/GPU work;
- network/disk;
- memory-related diagnostics;
- frame-rate/rendering metrics where available.

## Agent rule
Do not add high-cardinality or user-identifying state labels. State names should describe product modes, not people/content IDs.

Source:
- https://developer.apple.com/videos/play/wwdc2026/222/
