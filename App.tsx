import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useDeviceOrientation } from './src/hooks/useDeviceOrientation';
import { WindowViewer } from './src/components/WindowViewer';
import { WindowFrame } from './src/components/WindowFrame';
import { DebugOverlay } from './src/components/DebugOverlay';

const SCENE = require('./images/window-view.png');
const IMAGE_ASPECT = 3.0;

export default function App() {
  // Animated values are driven directly by the sensor callback in the hook —
  // no spring useEffect, no re-renders in the animation hot path.
  const animX = useRef(new Animated.Value(0)).current;
  const animY = useRef(new Animated.Value(0)).current;

  const { tiltX, tiltY, isReady } = useDeviceOrientation({
    animX,
    animY,
    maxAngleDeg: 25,
    smoothing: 0.6,
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden />

      <WindowViewer
        source={SCENE}
        tiltX={tiltX}
        tiltY={tiltY}
        imageAspect={IMAGE_ASPECT}
        animatedX={animX}
        animatedY={animY}
      />

      <WindowFrame />
      <DebugOverlay tiltX={tiltX} tiltY={tiltY} isReady={isReady} />

      {!isReady && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Hold your phone upright and tilt to look around</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  hintContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 60,
  },
  hintText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    letterSpacing: 0.4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
