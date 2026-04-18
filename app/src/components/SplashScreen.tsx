import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  onStart: () => void;
};

export function SplashScreen({ onStart }: Props) {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const flicker = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleOpacity, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(buttonOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]).start();

    // Subtle flicker on the title
    const flickerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 0.85, duration: 120, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.delay(3000 + Math.random() * 4000),
        Animated.timing(flicker, { toValue: 0.7, duration: 60, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 1, duration: 60, useNativeDriver: true }),
      ])
    );
    flickerLoop.start();
    return () => flickerLoop.stop();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.title, { opacity: Animated.multiply(titleOpacity, flicker) }]}>
        PERFECT{'\n'}NEIGHBOR
      </Animated.Text>
      <Animated.View style={{ opacity: buttonOpacity }}>
        <Pressable
          style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
          onPress={onStart}
        >
          <Text style={styles.startText}>START</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050202',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 60,
  },
  title: {
    color: '#c8102e',
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(200,16,46,0.6)',
    textShadowRadius: 20,
    lineHeight: 64,
  },
  startButton: {
    borderColor: 'rgba(160,20,20,0.7)',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 60,
    backgroundColor: 'rgba(12,4,4,0.9)',
  },
  startButtonPressed: {
    backgroundColor: 'rgba(80,8,8,0.95)',
    borderColor: 'rgba(200,40,40,0.9)',
  },
  startText: {
    color: '#e8d5b7',
    fontSize: 16,
    letterSpacing: 6,
    fontWeight: '600',
  },
});
