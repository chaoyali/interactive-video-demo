import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Interaction } from '@ivd/shared';

import { NodeVideoBackground } from '../../engine/NodeVideoBackground';
import type { InteractionRenderer } from '../../engine/types';

type LinearInteraction = Extract<Interaction, { type: 'linear' }>;

export const LinearRenderer: InteractionRenderer<LinearInteraction> = ({
  node,
  interaction,
  onTransition,
}) => {
  const advance = () => onTransition(interaction.next);

  return (
    <NodeVideoBackground video={node.video} onEnd={advance}>
      <Pressable style={StyleSheet.absoluteFill} onPress={advance}>
        <View style={styles.footer} pointerEvents="none">
          <Text style={styles.label}>{node.label}</Text>
          <Text style={styles.hint}>Tap to continue</Text>
        </View>
      </Pressable>
    </NodeVideoBackground>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    padding: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  hint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
