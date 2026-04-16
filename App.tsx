import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { useDeviceOrientation } from './src/hooks/useDeviceOrientation';
import { WindowViewer } from './src/components/WindowViewer';
import { WindowFrame } from './src/components/WindowFrame';

// The panoramic image to peer into
const SCENE = require('./images/window-view.png');

// How much the image aspect ratio exceeds the viewport (tune to your image)
const IMAGE_ASPECT = 3.0;

export default function App() {
  const { tiltX, tiltY, isReady } = useDeviceOrientation({
    maxAngleDeg: 25,   // physical tilt angle that maps to full pan travel
    smoothing: 0.82,   // 0 = raw/instant, 1 = never moves
  });

  // Animated values so RN can drive the pan on the UI thread
  const animX = useRef(new Animated.Value(0)).current;
  const animY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isReady) return;
    // spring gives a pleasing physical weight to the movement
    Animated.spring(animX, {
      toValue: tiltX,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
      mass: 0.6,
    }).start();
    Animated.spring(animY, {
      toValue: tiltY,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
      mass: 0.6,
    }).start();
  }, [tiltX, tiltY, isReady]);

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

      {/* Hint text fades once sensors come online */}
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
