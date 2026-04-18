import type { z } from 'zod';
import type {
  StorySchema,
  NodeSchema,
  InteractionSchema,
  ChoiceSchema,
  VideoRefSchema,
  FlagMutationSchema,
  FlagValueSchema,
  DirectorNotesSchema,
  EditorMetaSchema,
  PositionSchema,
} from './schema';

export type Story = z.infer<typeof StorySchema>;
export type Node = z.infer<typeof NodeSchema>;
export type Interaction = z.infer<typeof InteractionSchema>;
export type Choice = z.infer<typeof ChoiceSchema>;
export type VideoRef = z.infer<typeof VideoRefSchema>;
export type FlagMutation = z.infer<typeof FlagMutationSchema>;
export type FlagValue = z.infer<typeof FlagValueSchema>;
export type DirectorNotes = z.infer<typeof DirectorNotesSchema>;
export type EditorMeta = z.infer<typeof EditorMetaSchema>;
export type Position = z.infer<typeof PositionSchema>;

export type NodeId = string;
export type NodeKind = Node['kind'];
export type InteractionType = Interaction['type'];

export type { Condition } from './schema';
