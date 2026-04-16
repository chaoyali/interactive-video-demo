/**
 * useDeviceOrientation
 *
 * Platform-aware sensor abstraction. Drives animX/animY Animated.Values
 * DIRECTLY from the sensor callback — no React state in the animation hot
 * path, so panning is smooth at the full sensor rate (~60 fps).
 *
 * Platform input paths:
 *   iOS / Android  →  expo-sensors DeviceMotion (rotation in radians)
 *   Web mobile     →  DeviceOrientationEvent   (gamma/beta in degrees)
 *   Web desktop    →  mousemove fallback        (for development)
 *
 * Returns { isReady, tiltX, tiltY } — state updated at a throttled rate
 * for display purposes only (debug overlay, hint text). Do NOT drive
 * animation from these — use animX/animY directly.
 */

import { useEffect, useRef, useState } from 'react';
import { Animated, Platform } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

const RAD_TO_DEG = 180 / Math.PI;

export interface OrientationState {
  tiltX: number;
  tiltY: number;
  isReady: boolean;
  /** Neutral reference pose captured on first event, in degrees. null until ready. */
  neutral: { gamma: number; beta: number } | null;
}

interface UseDeviceOrientationOptions {
  /** Animated.Value to drive horizontally (left -1 → right +1) */
  animX: Animated.Value;
  /** Animated.Value to drive vertically (up -1 → down +1) */
  animY: Animated.Value;
  /** Max physical angle (degrees) that maps to ±1. Default: 25 */
  maxAngleDeg?: number;
  /** Low-pass smoothing 0–1. Higher = smoother but laggier. Default: 0.6 */
  smoothing?: number;
  /** Sensor interval in ms (native only). Default: 16 */
  intervalMs?: number;
}

export function useDeviceOrientation({
  animX,
  animY,
  maxAngleDeg = 25,
  smoothing = 0.6,
  intervalMs = 16,
}: UseDeviceOrientationOptions): OrientationState {
  const [state, setState] = useState<OrientationState>({
    tiltX: 0,
    tiltY: 0,
    isReady: false,
    neutral: null,
  });

  const smoothed = useRef({ x: 0, y: 0 });
  const neutral  = useRef<{ x: number; y: number } | null>(null);
  const isReadyRef = useRef(false);
  const optsRef = useRef({ maxAngleDeg, smoothing });
  optsRef.current = { maxAngleDeg, smoothing };

  // Called with DEGREE values regardless of platform
  const handleDegrees = useRef((degX: number, degY: number) => {
    // Capture neutral position on first event so panning is always relative
    // to however the user is holding the phone when the app starts.
    if (!neutral.current) {
      neutral.current = { x: degX, y: degY };
    }
    const relX = degX - neutral.current.x;
    const relY = degY - neutral.current.y;

    const { maxAngleDeg: max, smoothing: s } = optsRef.current;
    const clamp = (v: number) => Math.max(-1, Math.min(1, v / max));

    smoothed.current.x = smoothed.current.x * s - clamp(relX) * (1 - s);
    smoothed.current.y = smoothed.current.y * s - clamp(relY) * (1 - s);

    // Drive animation directly — bypasses React render cycle entirely
    animX.setValue(smoothed.current.x);
    animY.setValue(smoothed.current.y);

    // Update display state only on first event (isReady flip) to avoid
    // triggering 60 re-renders per second
    if (!isReadyRef.current) {
      isReadyRef.current = true;
      setState({
        tiltX: smoothed.current.x,
        tiltY: smoothed.current.y,
        isReady: true,
        neutral: { gamma: neutral.current.x, beta: neutral.current.y },
      });
    }
  });

  useEffect(() => {
    // ── Native (iOS / Android) ──────────────────────────────────────────────
    // DeviceMotion.rotation is in radians → convert to degrees
    if (Platform.OS !== 'web') {
      DeviceMotion.setUpdateInterval(intervalMs);
      const sub = DeviceMotion.addListener((data) => {
        const gamma = (data.rotation?.gamma ?? 0) * RAD_TO_DEG;
        const beta  = (data.rotation?.beta  ?? 0) * RAD_TO_DEG;
        handleDegrees.current(gamma, beta);
      });
      return () => sub.remove();
    }

    // ── Web mobile — DeviceOrientationEvent (values already in degrees) ─────
    const supportsOrientation =
      typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;

    if (supportsOrientation) {
      const handler = (e: DeviceOrientationEvent) => {
        handleDegrees.current(e.gamma ?? 0, e.beta ?? 0);
      };

      const DOE = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (typeof DOE.requestPermission === 'function') {
        DOE.requestPermission()
          .then((r: string) => {
            if (r === 'granted') window.addEventListener('deviceorientation', handler);
          })
          .catch(() => {});
      } else {
        window.addEventListener('deviceorientation', handler);
      }
      return () => window.removeEventListener('deviceorientation', handler);
    }

    // ── Web desktop — mouse fallback ─────────────────────────────────────────
    const handleMouse = (e: MouseEvent) => {
      const max = optsRef.current.maxAngleDeg;
      handleDegrees.current(
        (e.clientX / window.innerWidth  - 0.5) * 2 * max,
        (e.clientY / window.innerHeight - 0.5) * 2 * max,
      );
    };
    window.addEventListener('mousemove', handleMouse);
    isReadyRef.current = true;
    setState((s) => ({ ...s, isReady: true }));
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [intervalMs]);

  return state;
}
