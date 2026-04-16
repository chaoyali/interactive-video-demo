/**
 * useDeviceOrientation
 *
 * Platform-aware sensor abstraction:
 *   - iOS / Android  →  expo-sensors DeviceMotion
 *   - Web mobile     →  DeviceOrientationEvent (browser API)
 *   - Web desktop    →  mouse movement fallback (for development)
 *
 * Returns { tiltX, tiltY } normalized to [-1, 1].
 *   tiltX: left (-1) → right (+1)
 *   tiltY: up   (-1) → down  (+1)
 */

import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export interface OrientationState {
  tiltX: number;
  tiltY: number;
  isReady: boolean;
}

interface UseDeviceOrientationOptions {
  /** Max physical angle (degrees) that maps to ±1. Default: 30 */
  maxAngleDeg?: number;
  /** Low-pass smoothing 0–1. Higher = smoother but laggier. Default: 0.85 */
  smoothing?: number;
  /** Sensor interval in ms (native only). Default: 16 */
  intervalMs?: number;
}

export function useDeviceOrientation({
  maxAngleDeg = 30,
  smoothing = 0.85,
  intervalMs = 16,
}: UseDeviceOrientationOptions = {}): OrientationState {
  const [state, setState] = useState<OrientationState>({
    tiltX: 0,
    tiltY: 0,
    isReady: false,
  });

  const smoothed = useRef({ x: 0, y: 0 });

  const clamp = (v: number) => Math.max(-1, Math.min(1, v / maxAngleDeg));

  const applyFilter = (rawX: number, rawY: number) => {
    smoothed.current.x = smoothed.current.x * smoothing + clamp(rawX) * (1 - smoothing);
    smoothed.current.y = smoothed.current.y * smoothing + clamp(rawY) * (1 - smoothing);
    setState({
      tiltX: smoothed.current.x,
      tiltY: smoothed.current.y,
      isReady: true,
    });
  };

  useEffect(() => {
    // ── Native (iOS / Android) ───────────────────────────────────────────────
    if (Platform.OS !== 'web') {
      // Dynamic import keeps expo-sensors out of the web bundle entirely
      let cleanup: (() => void) | undefined;
      import('expo-sensors').then(({ DeviceMotion }) => {
        DeviceMotion.setUpdateInterval(intervalMs);
        const sub = DeviceMotion.addListener((data) => {
          applyFilter(data.rotation?.gamma ?? 0, data.rotation?.beta ?? 0);
        });
        cleanup = () => sub.remove();
      });
      return () => cleanup?.();
    }

    // ── Web mobile — DeviceOrientationEvent ──────────────────────────────────
    const supportsOrientation =
      typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;

    if (supportsOrientation) {
      const handleOrientation = (e: DeviceOrientationEvent) => {
        applyFilter(e.gamma ?? 0, e.beta ?? 0);
      };

      // iOS 13+ requires explicit permission
      const DOE = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (typeof DOE.requestPermission === 'function') {
        DOE.requestPermission()
          .then((result: string) => {
            if (result === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            }
          })
          .catch(() => {
            // permission denied — fall through to mouse fallback below
          });
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }

      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }

    // ── Web desktop — mouse movement fallback (for development) ─────────────
    const handleMouse = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;   // -1 to 1
      const y = (e.clientY / window.innerHeight - 0.5) * 2;  // -1 to 1
      applyFilter(x * maxAngleDeg, y * maxAngleDeg);
    };

    window.addEventListener('mousemove', handleMouse);
    setState((s) => ({ ...s, isReady: true }));
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [maxAngleDeg, smoothing, intervalMs]);

  return state;
}
