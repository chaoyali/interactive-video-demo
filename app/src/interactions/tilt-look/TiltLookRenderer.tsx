import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Interaction } from '@ivd/shared';

import { WindowViewer } from '../../components/WindowViewer';
import { useDeviceOrientation } from '../../hooks/useDeviceOrientation';
import { resolveVideo } from '../../engine/videoRegistry';
import type { InteractionRenderer } from '../../engine/types';

type TiltLookInteraction = Extract<Interaction, { type: 'tilt-look' }>;

export const TiltLookRenderer: InteractionRenderer<TiltLookInteraction> = ({
  node,
  interaction,
  onTransition,
}) => {
  const animX = useRef(new Animated.Value(0)).current;
  const animY = useRef(new Animated.Value(0)).current;

  const { isReady } = useDeviceOrientation({
    animX,
    animY,
    maxAngleDeg: interaction.maxAngleDeg,
    smoothing: 0.6,
  });

  const advance = () => onTransition(interaction.next);
  const asset = resolveVideo(node.video.src);

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={advance}>
      <WindowViewer
        source={asset}
        sourceAspect={node.video.sourceAspect}
        zoom={interaction.zoom}
        animatedX={animX}
        animatedY={animY}
      />

      {!isReady && (
        <View style={styles.hintContainer} pointerEvents="none">
          <Text style={styles.hintText}>
            Hold your phone upright and tilt to look around
          </Text>
        </View>
      )}

      <View style={styles.footer} pointerEvents="none">
        <Text style={styles.label}>{node.label}</Text>
        <Text style={styles.tapHint}>Tap to continue</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  hintContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 96,
  },
  hintText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    letterSpacing: 0.4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  footer: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingBottom: 32,
    alignItems: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  tapHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
