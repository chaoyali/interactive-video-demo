import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Interaction } from '@ivd/shared';

import { NodeVideoBackground } from '../../engine/NodeVideoBackground';
import { evaluateCondition } from '../../engine/conditions';
import type { InteractionRenderer } from '../../engine/types';

type HubInteraction = Extract<Interaction, { type: 'hub' }>;

export const HubRenderer: InteractionRenderer<HubInteraction> = ({
  node,
  interaction,
  flags,
  hubVisits,
  onTransition,
}) => {
  const shouldAdvance = evaluateCondition(interaction.advanceWhen, flags);

  useEffect(() => {
    if (shouldAdvance) {
      onTransition(interaction.advanceTo);
    }
  }, [shouldAdvance, interaction.advanceTo, onTransition]);

  if (shouldAdvance) {
    // Short blank frame while the transition effect fires — avoids flashing
    // the hub UI when re-entry immediately satisfies advanceWhen.
    return <View style={styles.blank} />;
  }

  const availableChoices = interaction.choices.filter((c) => !hubVisits.has(c.id));
  const completedCount = interaction.choices.length - availableChoices.length;

  return (
    <NodeVideoBackground video={node.video}>
      <View style={styles.overlay} pointerEvents="box-none">
        <Text style={styles.prompt}>{node.label}</Text>

        <View style={styles.choiceList}>
          {availableChoices.map((choice) => (
            <Pressable
              key={choice.id}
              style={({ pressed }) => [styles.choice, pressed && styles.choicePressed]}
              onPress={() =>
                onTransition(
                  choice.next,
                  choice.onSelect,
                  { hubId: node.id, choiceId: choice.id }
                )
              }
            >
              <Text style={styles.choiceText}>{choice.label}</Text>
            </Pressable>
          ))}
        </View>

        {completedCount > 0 && (
          <Text style={styles.progress}>
            {completedCount} of {interaction.choices.length} reviewed
          </Text>
        )}
      </View>
    </NodeVideoBackground>
  );
};

const styles = StyleSheet.create({
  blank: { flex: 1, backgroundColor: '#000' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 48,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  prompt: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
  choiceList: { gap: 10 },
  choice: {
    backgroundColor: 'rgba(20,20,22,0.85)',
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  choicePressed: { backgroundColor: 'rgba(60,60,70,0.95)' },
  choiceText: {
    color: '#f5f5f7',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  progress: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    letterSpacing: 0.4,
    textAlign: 'center',
    marginTop: 14,
  },
});
