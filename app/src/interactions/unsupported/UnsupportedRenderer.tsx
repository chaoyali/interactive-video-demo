import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Interaction } from '@ivd/shared';

import { NodeVideoBackground } from '../../engine/NodeVideoBackground';
import type { InteractionRenderer } from '../../engine/types';

// Placeholder shown for interaction types not yet implemented
// (hub, tilt-look, tap-hotspot, qte). Exposes a dev "skip" control that picks
// a reasonable next node so the story remains walkable end-to-end during development.

export const UnsupportedRenderer: InteractionRenderer = ({
  node,
  interaction,
  onTransition,
}) => {
  const nextTargets = collectTargets(interaction);

  return (
    <NodeVideoBackground video={node.video}>
      <View style={styles.overlay}>
        <Text style={styles.badge}>[not yet implemented]</Text>
        <Text style={styles.type}>{interaction.type}</Text>
        <Text style={styles.label}>{node.label}</Text>
        <View style={styles.targets}>
          {nextTargets.map(({ label, nextId }) => (
            <Pressable
              key={nextId + label}
              style={({ pressed }) => [styles.target, pressed && styles.targetPressed]}
              onPress={() => onTransition(nextId)}
            >
              <Text style={styles.targetText}>→ {label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </NodeVideoBackground>
  );
};

function collectTargets(interaction: Interaction): { label: string; nextId: string }[] {
  switch (interaction.type) {
    case 'linear':
    case 'tilt-look':
      return [{ label: interaction.next, nextId: interaction.next }];
    case 'choice':
      return interaction.choices.map((c) => ({ label: `${c.label} → ${c.next}`, nextId: c.next }));
    case 'hub':
      return [
        ...interaction.choices.map((c) => ({ label: `${c.label} → ${c.next}`, nextId: c.next })),
        { label: `[advanceTo] ${interaction.advanceTo}`, nextId: interaction.advanceTo },
      ];
    case 'tap-hotspot':
      return interaction.hotspots.map((h) => ({
        label: `${h.label ?? h.id} → ${h.next}`,
        nextId: h.next,
      }));
    case 'qte':
      return [
        { label: `success → ${interaction.onSuccess}`, nextId: interaction.onSuccess },
        { label: `fail → ${interaction.onFail}`, nextId: interaction.onFail },
      ];
    case 'ending':
      return [];
  }
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 24,
    paddingTop: 80,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  badge: {
    color: '#c8a94a',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
  },
  type: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginBottom: 32,
  },
  targets: { gap: 8 },
  target: {
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  targetPressed: { backgroundColor: 'rgba(255,255,255,0.08)' },
  targetText: {
    color: '#fff',
    fontSize: 13,
  },
});
