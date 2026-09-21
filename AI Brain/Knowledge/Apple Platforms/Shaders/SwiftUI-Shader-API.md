---
topic: SwiftUI Shader API
category: shader
status: SHIPPING
verified: 2026-09-21
confidence: primary-source-verified
---

# SwiftUI Shader API

SwiftUI exposes stitchable Metal functions through `Shader`, `ShaderLibrary`, and three primary view effects.

## Choose the right modifier

### colorEffect
Per-pixel color transform. Best when output depends on current pixel position/color and no neighboring layer sampling is needed.

### distortionEffect
Returns a source position to sample. Best for geometric warps where the transformation is fundamentally coordinate remapping.

### layerEffect
Receives `SwiftUI::Layer` and can sample other locations. Use for neighborhood sampling, blur-like effects, refraction, smears, complex warps, and effects requiring multiple source pixels.

## Important APIs
- `Shader.compile(as:)`: asynchronously precompile to reduce first-use rendering stalls.
- `Shader.dithersColor`: useful for smooth procedural gradients to reduce visible banding.
- Shader also conforms to `ShapeStyle`, so a stitchable function can fill text/shapes procedurally.

## Performance rules
- Set `maxSampleOffset` to the true maximum required sampling distance.
- Neighbor sampling costs more than simple color math.
- Do not keep a TimelineView-driven shader rendering when off-screen or otherwise unnecessary.
- Use one coherent pass when it genuinely replaces several passes, but do not build an unreadable mega-shader solely to minimize modifier count.
- When the problem becomes thousands of independent geometric objects, particles, simulations, or compute passes, move to a real Metal renderer instead of forcing it through SwiftUI effects.

Sources:
- https://developer.apple.com/documentation/swiftui/shader
- https://developer.apple.com/documentation/swiftui/visualeffect/layereffect(_:maxsampleoffset:isenabled:)
