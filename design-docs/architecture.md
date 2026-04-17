# Interactive Drama — High-Level Design

## Concept

An interactive mobile experience where the viewer physically tilts their phone to look around a scene, as if pressing their device against a window at night. The character in the story is doing the same thing — creating a first-person, embodied moment of tension.

---

## User Experience

1. The viewer holds their phone upright in portrait mode.
2. A looping ambient video fills the screen — a dimly lit interior scene that extends beyond the viewport on every side.
3. Tilting the phone left/right/up/down pans the scene, revealing what is hidden at the edges. At full tilt, every part of the video is reachable.
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
│   WindowViewer (component)          │  Panning media renderer (expo-video)
│   Animated.Value.interpolate        │  Direct sensor→transform mapping
├─────────────────────────────────────┤
│   DebugOverlay (component)          │  Dev-only diagnostics (native)
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
WindowViewer  (content-agnostic — pans whatever View sits inside it)
  - wraps expo-video's VideoView with Animated.createAnimatedComponent
  - video autoplays, muted, looping via useVideoPlayer
  - cover-size the media to the viewport (preserving sourceAspect), then × zoom
       coverH = max(vh, vw / sourceAspect);  coverW = coverH × sourceAspect
       mediaH = coverH × zoom;               mediaW = coverW × zoom
  - maxOffset{X,Y} = (media{W,H} − viewport{W,H}) / 2    (pure overhang math)
  - animX.interpolate([-1,1] → [+maxOffsetX, -maxOffsetX])  ← sign flipped
  - animY.interpolate([-1,1] → [+maxOffsetY, -maxOffsetY])  ← tilt fwd = pan down
```

---

## File Structure

```
/
├── App.tsx                           # Root: wires sensor → animation → render
├── app.json                          # Expo config + iOS motion permission + expo-video plugin
├── videos/
│   └── room.mp4                      # Ambient scene (720×720, square)
├── design-docs/
│   └── architecture.md               # This file
└── src/
    ├── hooks/
    │   └── useDeviceOrientation.ts   # Platform-aware sensor abstraction
    └── components/
        ├── WindowViewer.tsx          # Panning video renderer (expo-video)
        └── DebugOverlay.tsx          # Dev-only sensor diagnostics (native)
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

### Content-agnostic viewer with zoom-based sizing
`WindowViewer` doesn't know it's rendering video. It sizes a rectangle (preserving `sourceAspect`) to "cover" the viewport, multiplies by `zoom` to create overhang on every side, and animates that box's `translateX` / `translateY`. Pan ranges are derived from the overhang, so tilt always reaches the exact media edges — no unreachable content, no black bars. Swapping video ↔ image ↔ WebGL view is a one-line content swap inside the viewer.

### Looping muted video via `expo-video`
The scene is an ambient `.mp4` loaded with `useVideoPlayer`, configured `loop = true` + `muted = true` + `play()` on creation. Muted autoplay is reliable across platforms and matches the ambience-only UX. `VideoView` is wrapped with `Animated.createAnimatedComponent` so it accepts the same animated `transform` style as any other View. Registered in `app.json` under `plugins`.

### Cross-platform style compatibility
React Native Web deprecates certain style props. Rule applied throughout:
- `pointerEvents` lives in `style`, not as a JSX prop

---

## Tuning Parameters

| Parameter | Location | Effect |
|---|---|---|
| `maxAngleDeg` | `App.tsx` → hook | Physical tilt angle that maps to full pan. Default 25°. Lower = more sensitive. |
| `smoothing` | `App.tsx` → hook | 0 = raw/instant, 1 = never moves. Default 0.6. Controls jitter removal and perceived lag. |
| `intervalMs` | `App.tsx` → hook | Native sensor sample interval. Default 16ms (~60 Hz). Web uses whatever the browser emits. |
| `SOURCE_ASPECT` | `App.tsx` | Set to the source media's actual width÷height ratio. Mismatch = stretched or cropped content. |
| `ZOOM` | `App.tsx` → `WindowViewer` | How far past "just covering" the viewport to scale the media. Default 1.3. Larger = more to explore. |

---

## Scene Asset Requirements

- **Format:** MP4 (H.264). Bundled with the app via `require('./videos/…')`.
- **Aspect ratio:** Any — declare it in `SOURCE_ASPECT`. Current asset is 1:1 (720×720).
- **Resolution:** High enough that the `ZOOM`-scaled media still looks sharp on target devices. For `zoom = 1.3` on a 3× density phone, aim for the source's shorter side ≥ viewport-shorter × 3 × 1.3.
- **Duration:** Short loop (5–15 s). Muted, so no audio design needed — keep the visual loop seamless.
- **Content:** Interior scene, lit from within. Place points of interest toward the edges so the viewer is rewarded for tilting to explore.

---

## Future Extensions

| Idea | Notes |
|---|---|
| Sound tied to pan position | Unmute the player and play positional audio cues as the viewer tilts toward specific areas. Needs a gesture to unlock audio on some platforms. |
| Multiple scenes / story branching | Navigator between scenes based on what the viewer "finds" by tilting. Swap `source` on `useVideoPlayer`. |
| 360° equirectangular render | Replace `WindowViewer` with a Three.js / WebGL sphere. Hook interface is unchanged. |
| Haptic feedback | Trigger `expo-haptics` when panning past a point of interest. |
| Remove `DebugOverlay` | It's dev-only. Delete the component and its render site when shipping. |
