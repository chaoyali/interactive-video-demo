import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Interaction } from '@ivd/shared';

import { NodeVideoBackground } from '../../engine/NodeVideoBackground';
import { evaluateCondition } from '../../engine/conditions';
import type { InteractionRenderer } from '../../engine/types';

type ChoiceInteraction = Extract<Interaction, { type: 'choice' }>;

export const ChoiceRenderer: InteractionRenderer<ChoiceInteraction> = ({
  node,
  interaction,
  flags,
  onTransition,
}) => {
  const visibleChoices = interaction.choices.filter(
    (c) => !c.condition || evaluateCondition(c.condition, flags)
  );

  // Pair choices into rows of 2; last row may have 1 item spanning full width
  const rows: (typeof visibleChoices)[] = [];
  for (let i = 0; i < visibleChoices.length; i += 2) {
    rows.push(visibleChoices.slice(i, i + 2));
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
                  style={({ pressed }) => [
                    styles.choice,
                    pressed && styles.choicePressed,
                  ]}
                  onPress={() => onTransition(choice.next, choice.onSelect)}
                >
                  <Text style={styles.choiceText}>{choice.label}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>
    </NodeVideoBackground>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 48,
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
  choiceList: {
    gap: 10,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  choice: {
    width: 320,
    backgroundColor: 'rgba(12,4,4,0.9)',
    borderColor: 'rgba(160,20,20,0.6)',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  choicePressed: {
    backgroundColor: 'rgba(80,8,8,0.95)',
    borderColor: 'rgba(200,40,40,0.9)',
  },
  choiceText: {
    color: '#e8d5b7',
    fontSize: 14,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
