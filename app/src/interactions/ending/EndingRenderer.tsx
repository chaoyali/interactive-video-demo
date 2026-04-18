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
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowRadius: 12,
  },
  subtitle: {
    color: 'rgba(232,213,183,0.7)',
    fontSize: 14,
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  restart: {
    borderColor: 'rgba(160,20,20,0.7)',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 36,
    backgroundColor: 'rgba(12,4,4,0.85)',
  },
  restartPressed: { backgroundColor: 'rgba(80,8,8,0.95)', borderColor: 'rgba(200,40,40,0.9)' },
  restartText: {
    color: '#e8d5b7',
    fontSize: 14,
    letterSpacing: 3,
  },
});
