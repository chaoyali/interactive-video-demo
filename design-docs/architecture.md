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
│   Animated.Value.interpolate        │  Direct sensor→transform mapping
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
useDeviceOrientation  (sensor hot path, ~60 Hz)
  - native: DeviceMotion.rotation.{gamma,beta} (radians → degrees)
  - web mobile: DeviceOrientationEvent.{gamma,beta} (already degrees)
  - desktop: mousemove → synthetic gamma/beta
  - capture neutral pose on first event (relative panning)
  - clamp (relDeg / maxAngleDeg) to [-1, 1]
  - exponential low-pass: smoothed = smoothed*s + new*(1-s)
  - write directly to animX.setValue / animY.setValue
      │
      ▼
App.tsx
  - owns animX / animY as Animated.Value refs
  - passes them into both the hook (writer) and WindowViewer (reader)
  - NO spring / no JS state on the hot path
      │
      ▼
WindowViewer
  - panoramic image wider than viewport (width = viewportH × imageAspect)
  - animX.interpolate([-1,1] → [+maxOffsetX, -maxOffsetX])  ← sign flipped
  - animY.interpolate([-1,1] → [+maxOffsetY, -maxOffsetY])  ← tilt fwd = pan down
  - maxOffset = viewport{W,H} × panRange{X,Y}
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

`expo-sensors` is imported at module top; on web the hook takes the `DeviceOrientationEvent` / `mousemove` branch and never touches `DeviceMotion`. All platform branching is contained inside the hook — nothing outside it knows which path is active.

### Neutral-pose capture
The first sensor event defines the zero point (`neutral.current`). All subsequent readings are expressed relative to that pose, so panning works regardless of how the user is holding the phone when the app starts (flat on a table, upright, reclined, etc.).

### Direct-write to Animated.Value (no spring, no React state)
The sensor callback calls `animX.setValue(...)` / `animY.setValue(...)` directly. No `Animated.spring`, no `useState` on the hot path — the JS→native bridge handles the transform update and React never re-renders during panning. The hook only sets React state once, to flip `isReady`.

Tradeoff vs. the prior spring-based design: we lose the spring's physical "weight", but gain 1:1 responsiveness (tilt → image follows with just the smoothing lag). Feel is tuned via `smoothing` alone.

### Low-pass filter on raw sensor input
Raw gyroscope data is noisy. An exponential low-pass filter (`smoothed = smoothed*s + new*(1-s)`, default `s = 0.6`) is applied inside the hook before the clamped value is written to the `Animated.Value`.

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
| `maxAngleDeg` | `App.tsx` → hook | Physical tilt angle that maps to full pan. Default 25°. Lower = more sensitive. |
| `smoothing` | `App.tsx` → hook | 0 = raw/instant, 1 = never moves. Default 0.6. Controls jitter removal and perceived lag. |
| `intervalMs` | `App.tsx` → hook | Native sensor sample interval. Default 16ms (~60 Hz). Web uses whatever the browser emits. |
| `IMAGE_ASPECT` | `App.tsx` | Set to your image's actual width÷height ratio. |
| `panRangeX/Y` | `WindowViewer` props | Fraction of viewport the image travels. Default 0.6 / 0.3. |

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
