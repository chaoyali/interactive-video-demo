import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { validateStory } from '@ivd/shared';

import { StoryEngine } from './src/engine/StoryEngine';
import storyJson from '../stories/perfect-neighbor-demo/story.json';

export default function App() {
  const result = validateStory(storyJson);

  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden />
      {result.ok ? (
        <StoryEngine story={result.story} />
      ) : (
        <ScrollView contentContainerStyle={styles.errorBox}>
          <Text style={styles.errorTitle}>Story failed schema validation</Text>
          {result.errors.map((msg, i) => (
            <Text key={i} style={styles.errorItem}>
              • {msg}
            </Text>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  errorBox: {
    padding: 24,
    paddingTop: 80,
    backgroundColor: '#200',
  },
  errorTitle: {
    color: '#f66',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  errorItem: {
    color: '#fcc',
    fontSize: 13,
    marginBottom: 6,
  },
});
