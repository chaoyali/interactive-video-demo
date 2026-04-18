import type { ReactElement } from 'react';
import type {
  FlagMutation,
  FlagValue,
  Interaction,
  Node,
  NodeId,
} from '@ivd/shared';

export type Flags = Record<string, FlagValue>;

export type TransitionFn = (
  next: NodeId,
  mutations?: FlagMutation[],
  hubSelection?: { hubId: NodeId; choiceId: string }
) => void;

export interface RendererProps<I extends Interaction = Interaction> {
  node: Node;
  interaction: I;
  flags: Flags;
  hubVisits: ReadonlySet<string>;
  onTransition: TransitionFn;
  onRestart: () => void;
}

export type InteractionRenderer<I extends Interaction = Interaction> = (
  props: RendererProps<I>
) => ReactElement;
