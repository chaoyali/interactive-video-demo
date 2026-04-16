# Interactive Drama — High-Level Design

## Concept

An interactive mobile experience where the viewer physically tilts their phone to look around a scene, as if pressing their device against a window at night. The character in the story is doing the same thing — creating a first-person, embodied moment of tension.

---

## User Experience

1. The viewer holds their phone upright in portrait mode.
2. A dark window frame fills the screen. Behind it: a dimly lit interior scene.
3. Tilting the phone left/right/up/down pans the scene, revealing what is hidden at the edges.
4. The viewer controls the "camera" through physical movement alone — no buttons, no touch.

---

## Technical Architecture

### Layer Overview

```
┌─────────────────────────────────────┐
│           App.tsx                   │  Wires sensor → animation → UI
├─────────────────────────────────────┤
│   useDeviceOrientation (hook)       │  Platform-aware sensor abstraction
│   three input paths (see below)     │  iOS, Android, web mobile, web desktop
├─────────────────────────────────────┤
│   WindowViewer (component)          │  Panning image renderer
│   Animated.spring + nativeDriver    │  GPU-thread animation
├─────────────────────────────────────┤
│   WindowFrame (component)           │  Decorative overlay
│   Pure RN StyleSheet, no assets     │
└─────────────────────────────────────┘
```

### Data Flow

```
Platform sensor input (see Input Strategy below)
      │
      ▼
useDeviceOrientation
  - raw gamma (left/right tilt) → tiltX [-1, 1]
  - raw beta  (fwd/back tilt)   → tiltY [-1, 1]
  - exponential low-pass filter applied
  - clamped to maxAngleDeg threshold
      │
      ▼
App.tsx
  - Animated.spring drives animX / animY
  - spring params: damping, stiffness, mass
      │
      ▼
WindowViewer
  - panoramic image wider than viewport
  - animX/animY → Animated.Image translateX/Y
  - image travel range = panRangeX/Y × viewport size
      │
      ▼
WindowFrame (rendered on top, pointerEvents in style)
  - dark edge vignette
  - wooden cross-bar frame
  - corner brackets
```

---

## File Structure

```
/
├── App.tsx                           # Root: wires sensor → animation → render
├── app.json                          # Expo config + iOS motion permission
├── images/
│   └── window-view.png               # Panoramic scene asset
├── design-docs/
│   └── architecture.md               # This file
└── src/
    ├── hooks/
    │   └── useDeviceOrientation.ts   # Platform-aware sensor abstraction
    └── components/
        ├── WindowViewer.tsx          # Panning image renderer
        └── WindowFrame.tsx           # Window frame overlay
```

---

## Key Design Decisions

### Platform-aware sensor input (three paths)

`useDeviceOrientation` selects its input source at runtime based on `Platform.OS`:

| Environment | Input source | Notes |
|---|---|---|
| iOS / Android | `expo-sensors` `DeviceMotion` (dynamic import) | Native gyroscope; identical API on both platforms |
| Web — mobile | `DeviceOrientationEvent` (browser API) | Works on phone browsers; iOS 13+ requires permission prompt |
| Web — desktop | `mousemove` event | Fallback for development; cursor position maps to tilt |

`expo-sensors` is **dynamically imported** on native only, so it is never loaded in the web bundle and cannot crash the browser. All platform branching is contained inside the hook — nothing outside it knows which path is active.

### Animation on the native thread
`Animated.spring` with `useNativeDriver: true` runs entirely on the GPU/UI thread. The JS thread is not in the hot path during panning, so frame drops from JS work cannot affect smoothness.

### Low-pass filter before spring
Raw gyroscope data is noisy. An exponential low-pass filter (`smoothing` factor) is applied inside the hook before values reach the spring animator. This two-stage approach separates concerns: the filter removes jitter, the spring adds physical weight.

### Panoramic image as "canvas"
The scene is a single wide static image (3:1 to 4:1 aspect ratio). This avoids video complexity while still giving the viewer a space to explore. An ambient looping video can be substituted later with no architectural changes — `WindowViewer` accepts any `ImageSourcePropType`.

### Cross-platform style compatibility
React Native Web deprecates certain style props. Two rules applied throughout:
- `pointerEvents` lives in `style`, not as a JSX prop
- Shadows use `Platform.select` — `boxShadow` string on web, `shadow*` props on native

---

## Tuning Parameters

| Parameter | Location | Effect |
|---|---|---|
| `maxAngleDeg` | `App.tsx` → hook | Physical tilt angle that maps to full pan. Lower = more sensitive. |
| `smoothing` | `App.tsx` → hook | 0 = raw/instant, 1 = never moves. Controls jitter removal. |
| `IMAGE_ASPECT` | `App.tsx` | Set to your image's actual width÷height ratio. |
| `panRangeX/Y` | `WindowViewer` props | Fraction of viewport the image travels. |
| Spring `damping/stiffness/mass` | `App.tsx` | Controls the physical feel of the pan movement. |

---

## Scene Asset Requirements

- **Aspect ratio:** 3:1 to 4:1 (wide panoramic)
- **Resolution:** 3000×800 px minimum for smooth panning without visible pixelation
- **Content:** Interior scene, lit from within. Place the most interesting element off-center so the viewer is rewarded for exploring.
- **Format:** PNG or JPEG. Static image recommended for first version; ambient looping video is a straightforward upgrade path.

---

## Future Extensions

| Idea | Notes |
|---|---|
| Ambient video loop | Swap static image for a `<Video>` component. Hook and frame are unchanged. |
| Sound tied to pan position | Play audio cues as viewer tilts toward specific areas of the scene. |
| Multiple scenes / story branching | Navigator between scenes based on what the viewer "finds" by tilting. |
| 360° equirectangular render | Replace `WindowViewer` with a Three.js / WebGL sphere. Same hook interface. |
| Haptic feedback | Trigger `expo-haptics` when panning past a point of interest. |
