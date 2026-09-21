---
topic: Metal 4
category: metal
status: SHIPPING
verified: 2026-09-21
confidence: primary-source-verified
---

# Metal 4

Metal 4 remains the current major Metal generation.

## WWDC26 additions/highlights
- Quantized tensor formats and scale factors.
- Metal performance primitives supporting compressed weights and newer Neural Accelerators on supported M5 Pro/M5 Max hardware.
- Redesigned MetalFX temporal upscaler using Neural Engine/Neural Accelerators on supported hardware.
- MetalFX support for subrectangles/dynamic resolution, motion-vector integration, and distortion fields.
- Continued convergence of graphics, compute, and machine-learning work in GPU command pipelines.

## App guidance
For ordinary SwiftUI UI effects, prefer SwiftUI Shader APIs first. Use full Metal when the workload is a renderer/simulation rather than a filter on an existing view.

## Performance
- Reuse resources/pipelines.
- Avoid unnecessary full-screen sampling.
- Profile GPU bottlenecks with Metal tools rather than assuming shader work is free.
- Check hardware availability before relying on neural-accelerator-specific features.

Source:
- https://developer.apple.com/wwdc26/guides/metal/
