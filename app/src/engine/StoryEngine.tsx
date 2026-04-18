import React, { useCallback, useMemo, useReducer } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type {
  FlagMutation,
  NodeId,
  Story,
} from '@ivd/shared';

import { renderers } from './renderers';
import type { Flags, TransitionFn } from './types';

type EngineState = {
  currentNodeId: NodeId;
  flags: Flags;
  hubVisits: Record<NodeId, Set<string>>;
};

type EngineAction =
  | {
      type: 'transition';
      nextNodeId: NodeId;
      mutations?: FlagMutation[];
      hubSelection?: { hubId: NodeId; choiceId: string };
      nodeOnEnter?: FlagMutation[];
    }
  | { type: 'restart'; story: Story };

function applyMutations(flags: Flags, mutations: FlagMutation[] | undefined): Flags {
  if (!mutations || mutations.length === 0) return flags;
  const next = { ...flags };
  for (const m of mutations) next[m.flag] = m.value;
  return next;
}

function reducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case 'transition': {
      const afterSelect = applyMutations(state.flags, action.mutations);
      const afterEnter = applyMutations(afterSelect, action.nodeOnEnter);
      let hubVisits = state.hubVisits;
      if (action.hubSelection) {
        const { hubId, choiceId } = action.hubSelection;
        const prev = state.hubVisits[hubId] ?? new Set<string>();
        const next = new Set(prev);
        next.add(choiceId);
        hubVisits = { ...state.hubVisits, [hubId]: next };
      }
      return { currentNodeId: action.nextNodeId, flags: afterEnter, hubVisits };
    }
    case 'restart':
      return initialState(action.story);
  }
}

function initialState(story: Story): EngineState {
  return {
    currentNodeId: story.initialNodeId,
    flags: { ...story.initialFlags },
    hubVisits: {},
  };
}

export function StoryEngine({ story }: { story: Story }) {
  const [state, dispatch] = useReducer(reducer, story, initialState);

  const onTransition = useCallback<TransitionFn>(
    (nextNodeId, mutations, hubSelection) => {
      const nextNode = story.nodes[nextNodeId];
      dispatch({
        type: 'transition',
        nextNodeId,
        mutations,
        hubSelection,
        nodeOnEnter: nextNode?.onEnter,
      });
    },
    [story]
  );

  const onRestart = useCallback(() => {
    dispatch({ type: 'restart', story });
  }, [story]);

  const node = story.nodes[state.currentNodeId];
  const Renderer = node ? renderers[node.interaction.type] : undefined;

  const hubVisitsForNode = useMemo(
    () => state.hubVisits[state.currentNodeId] ?? new Set<string>(),
    [state.hubVisits, state.currentNodeId]
  );

  if (!node || !Renderer) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>
          Missing renderer or node: {state.currentNodeId}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Renderer
        node={node}
        interaction={node.interaction as never}
        flags={state.flags}
        hubVisits={hubVisitsForNode}
        onTransition={onTransition}
        onRestart={onRestart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  missing: { flex: 1, backgroundColor: '#400', alignItems: 'center', justifyContent: 'center' },
  missingText: { color: '#fff', fontSize: 14 },
});
