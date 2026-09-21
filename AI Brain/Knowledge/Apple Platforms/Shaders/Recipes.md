---
topic: SwiftUI shader recipes
category: shader
status: SHIPPING
verified: 2026-09-21
confidence: primary-source-verified
---

# Shader Recipes

## 1. Domain-warped artwork/background
Apple's WWDC26 example:
1. Render a normal SwiftUI image/artwork.
2. Apply `layerEffect`.
3. Sample a repeating noise texture.
4. Use two noise channels as a displacement vector.
5. Domain-warp by using one noise sample to offset a second noise lookup.
6. Pass elapsed time from `TimelineView(.animation)` to create motion.

Use for subtle hero/background motion. Keep displacement restrained unless the design explicitly calls for a strong effect.

Source:
- https://developer.apple.com/videos/play/wwdc2026/322/

## 2. Procedural text/shape fill
Use `Shader` directly as a ShapeStyle for iridescence, procedural gradients, energy fields, or noise fills. Enable `dithersColor` when smooth gradients band.

## 3. Prewarmed interaction shader
Construct the same shader/function/arguments shape used by an important transition and call `compile(as:)` before the first interaction.

## 4. State-driven shader
Feed scroll progress, gesture position, audio level, playback progress, or device motion as small uniform values. Keep SwiftUI responsible for state/layout and Metal responsible for pixel math.

## 5. Escalation boundary
Stay in SwiftUI shaders for pixel transforms. Move to MTKView/full Metal for particle geometry, simulations, multiple render/compute passes, or very large independent object counts.
