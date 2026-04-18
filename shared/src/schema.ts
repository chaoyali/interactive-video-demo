import { z } from 'zod';

export const FlagValueSchema = z.union([z.boolean(), z.number(), z.string()]);

export const FlagMutationSchema = z.object({
  flag: z.string().min(1),
  value: FlagValueSchema,
});

const FlagConditionSchema = z.object({
  op: z.enum(['eq', 'neq']),
  flag: z.string().min(1),
  value: FlagValueSchema,
});

type FlagCondition = z.infer<typeof FlagConditionSchema>;
type CompoundCondition = { op: 'all' | 'any'; conditions: Condition[] };
export type Condition = FlagCondition | CompoundCondition;

const CompoundConditionSchema: z.ZodType<CompoundCondition> = z.object({
  op: z.enum(['all', 'any']),
  conditions: z.lazy(() => z.array(ConditionSchema)),
});

export const ConditionSchema: z.ZodType<Condition> = z.union([
  FlagConditionSchema,
  CompoundConditionSchema,
]);

export const ChoiceSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  next: z.string().min(1),
  condition: ConditionSchema.optional(),
  onSelect: z.array(FlagMutationSchema).optional(),
});

export const VideoRefSchema = z.object({
  src: z.string().min(1),
  sourceAspect: z.number().positive(),
  loop: z.boolean().optional(),
});

export const DirectorNotesSchema = z.object({
  sceneLocation: z.string().optional(),
  timeOfDay: z.string().optional(),
  photography: z.string().optional(),
  soundDesign: z.array(z.string()).optional(),
  beats: z.array(z.string()).optional(),
});

export const InteractionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('linear'),
    next: z.string().min(1),
  }),
  z.object({
    type: z.literal('tilt-look'),
    next: z.string().min(1),
    maxAngleDeg: z.number().positive(),
    zoom: z.number().min(1),
  }),
  z.object({
    type: z.literal('choice'),
    choices: z.array(ChoiceSchema).min(1),
    timeoutMs: z.number().positive().optional(),
    defaultChoiceId: z.string().optional(),
  }),
  z.object({
    type: z.literal('hub'),
    choices: z.array(ChoiceSchema).min(1),
    advanceWhen: ConditionSchema,
    advanceTo: z.string().min(1),
  }),
  z.object({
    type: z.literal('tap-hotspot'),
    hotspots: z.array(
      z.object({
        id: z.string().min(1),
        label: z.string().optional(),
        rect: z.object({
          x: z.number(),
          y: z.number(),
          w: z.number(),
          h: z.number(),
        }),
        next: z.string().min(1),
        onTap: z.array(FlagMutationSchema).optional(),
      })
    ),
  }),
  z.object({
    type: z.literal('qte'),
    window: z.object({
      startMs: z.number().min(0),
      endMs: z.number().positive(),
    }),
    onSuccess: z.string().min(1),
    onFail: z.string().min(1),
  }),
  z.object({
    type: z.literal('ending'),
    outcome: z.string().min(1),
  }),
]);

export const NodeSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  kind: z.enum(['N', 'H', 'D', 'C']),
  video: VideoRefSchema,
  interaction: InteractionSchema,
  onEnter: z.array(FlagMutationSchema).optional(),
  director: DirectorNotesSchema.optional(),
});

export const PositionSchema = z.object({ x: z.number(), y: z.number() });

export const EditorMetaSchema = z.object({
  positions: z.record(PositionSchema).optional(),
});

export const StorySchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    version: z.number().int().positive(),
    initialNodeId: z.string().min(1),
    initialFlags: z.record(FlagValueSchema),
    nodes: z.record(NodeSchema),
    editor: EditorMetaSchema.optional(),
  })
  .superRefine((story, ctx) => {
    if (!story.nodes[story.initialNodeId]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `initialNodeId "${story.initialNodeId}" not found in nodes`,
        path: ['initialNodeId'],
      });
    }
    for (const [nodeId, node] of Object.entries(story.nodes)) {
      if (node.id !== nodeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `node key "${nodeId}" does not match node.id "${node.id}"`,
          path: ['nodes', nodeId, 'id'],
        });
      }
      for (const next of collectNextIds(node)) {
        if (!story.nodes[next]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `node "${nodeId}" references missing next node "${next}"`,
            path: ['nodes', nodeId],
          });
        }
      }
    }
  });

function collectNextIds(node: z.infer<typeof NodeSchema>): string[] {
  const i = node.interaction;
  switch (i.type) {
    case 'linear':
    case 'tilt-look':
      return [i.next];
    case 'choice':
      return i.choices.map((c) => c.next);
    case 'hub':
      return [...i.choices.map((c) => c.next), i.advanceTo];
    case 'tap-hotspot':
      return i.hotspots.map((h) => h.next);
    case 'qte':
      return [i.onSuccess, i.onFail];
    case 'ending':
      return [];
  }
}
