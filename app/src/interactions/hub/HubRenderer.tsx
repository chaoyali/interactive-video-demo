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

  const rows: (typeof availableChoices)[] = [];
  for (let i = 0; i < availableChoices.length; i += 2) {
    rows.push(availableChoices.slice(i, i + 2));
  }

  return (
    <NodeVideoBackground video={node.video}>
      <View style={styles.overlay} pointerEvents="box-none">
        <Text style={styles.prompt}>{node.label}</Text>

        <View style={styles.choiceList}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((choice) => (
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
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  prompt: {
    color: '#e8d5b7',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowRadius: 6,
    letterSpacing: 0.5,
  },
  choiceList: { gap: 10, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  choice: {
    width: 360,
    backgroundColor: 'rgba(12,4,4,0.5)',
    borderColor: 'rgba(160,20,20,0.6)',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  choicePressed: { backgroundColor: 'rgba(80,8,8,0.95)', borderColor: 'rgba(200,40,40,0.9)' },
  choiceText: {
    color: '#e8d5b7',
    fontSize: 14,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  progress: {
    color: 'rgba(160,20,20,0.8)',
    fontSize: 12,
    letterSpacing: 0.6,
    textAlign: 'center',
    marginTop: 14,
  },
});
