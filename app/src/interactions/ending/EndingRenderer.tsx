import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Interaction } from '@ivd/shared';

import { NodeVideoBackground } from '../../engine/NodeVideoBackground';
import type { InteractionRenderer } from '../../engine/types';

type EndingInteraction = Extract<Interaction, { type: 'ending' }>;

const OUTCOME_COPY: Record<string, { title: string; accent: string }> = {
  death: { title: 'You Died', accent: '#a4272a' },
  survive: { title: 'Survived', accent: '#6aa86d' },
  'survive-cliffhanger': { title: 'To Be Continued…', accent: '#c8a94a' },
};

export const EndingRenderer: InteractionRenderer<EndingInteraction> = ({
  node,
  interaction,
  onRestart,
}) => {
  const copy = OUTCOME_COPY[interaction.outcome] ?? {
    title: interaction.outcome,
    accent: '#888',
  };

  return (
    <NodeVideoBackground video={node.video}>
      <View style={styles.overlay}>
        <Text style={[styles.title, { color: copy.accent }]}>{copy.title}</Text>
        <Text style={styles.subtitle}>{node.label}</Text>
        <Pressable
          style={({ pressed }) => [styles.restart, pressed && styles.restartPressed]}
          onPress={onRestart}
        >
          <Text style={styles.restartText}>Restart</Text>
        </Pressable>
      </View>
    </NodeVideoBackground>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowRadius: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 40,
    textAlign: 'center',
  },
  restart: {
    borderColor: 'rgba(255,255,255,0.4)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  restartPressed: { backgroundColor: 'rgba(255,255,255,0.1)' },
  restartText: {
    color: '#fff',
    fontSize: 14,
    letterSpacing: 2,
  },
});
