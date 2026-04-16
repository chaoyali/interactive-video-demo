/**
 * DebugOverlay — temporary diagnostic panel.
 * Shows raw sensor values, platform path, and firing status.
 * Remove once sensor panning is confirmed working.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

interface Props {
  tiltX: number;
  tiltY: number;
  isReady: boolean;
}

export function DebugOverlay({ tiltX, tiltY, isReady }: Props) {
  const [raw, setRaw] = useState({ gamma: 0, beta: 0, fireCount: 0 });
  const [error, setError] = useState<string | null>(null);
  const fireCount = useRef(0);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let sub: { remove: () => void } | null = null;
    try {
      DeviceMotion.setUpdateInterval(200); // slow poll just for debug display
      sub = DeviceMotion.addListener((data) => {
        fireCount.current += 1;
        setRaw({
          gamma: data.rotation?.gamma ?? -999,
          beta:  data.rotation?.beta  ?? -999,
          fireCount: fireCount.current,
        });
      });
    } catch (e: unknown) {
      setError(String(e));
    }

    return () => sub?.remove();
  }, []);

  const row = (label: string, value: string) => (
    <View style={styles.row} key={label}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.panel} pointerEvents="none">
      <Text style={styles.title}>SENSOR DEBUG</Text>
      {row('platform',   Platform.OS)}
      {row('isReady',    String(isReady))}
      {row('tiltX',      tiltX.toFixed(3))}
      {row('tiltY',      tiltY.toFixed(3))}
      {row('raw.gamma',  raw.gamma === -999 ? 'undefined' : raw.gamma.toFixed(4) + ' rad')}
      {row('raw.beta',   raw.beta  === -999 ? 'undefined' : raw.beta.toFixed(4)  + ' rad')}
      {row('fire count', String(raw.fireCount))}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 8,
    padding: 12,
    minWidth: 220,
  },
  title: {
    color: '#facc15',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  label: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginRight: 12,
  },
  value: {
    color: '#fff',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  error: {
    color: '#f87171',
    fontSize: 11,
    marginTop: 6,
  },
});
