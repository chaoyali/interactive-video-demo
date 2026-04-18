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

  return (
    <NodeVideoBackground video={node.video}>
      <View style={styles.overlay} pointerEvents="box-none">
        <Text style={styles.prompt}>{node.label}</Text>
        <View style={styles.choiceList}>
          {visibleChoices.map((choice) => (
            <Pressable
              key={choice.id}
              style={({ pressed }) => [styles.choice, pressed && styles.choicePressed]}
              onPress={() => onTransition(choice.next, choice.onSelect)}
            >
              <Text style={styles.choiceText}>{choice.label}</Text>
            </Pressable>
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
    backgroundColor: 'rgba(0,0,0,0.35)',
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
  choiceList: {
    gap: 10,
  },
  choice: {
    backgroundColor: 'rgba(20,20,22,0.85)',
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  choicePressed: {
    backgroundColor: 'rgba(60,60,70,0.95)',
  },
  choiceText: {
    color: '#f5f5f7',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
