import type { Interaction } from '@ivd/shared';

import { LinearRenderer } from '../interactions/linear/LinearRenderer';
import { ChoiceRenderer } from '../interactions/choice/ChoiceRenderer';
import { EndingRenderer } from '../interactions/ending/EndingRenderer';
import { HubRenderer } from '../interactions/hub/HubRenderer';
import { TiltLookRenderer } from '../interactions/tilt-look/TiltLookRenderer';
import { UnsupportedRenderer } from '../interactions/unsupported/UnsupportedRenderer';
import type { InteractionRenderer } from './types';

type RendererRegistry = {
  [K in Interaction['type']]: InteractionRenderer<Extract<Interaction, { type: K }>>;
};

export const renderers: RendererRegistry = {
  linear: LinearRenderer,
  choice: ChoiceRenderer,
  ending: EndingRenderer,
  hub: HubRenderer,
  'tilt-look': TiltLookRenderer,
  // Milestone 5 placeholders — walkable via the dev "skip" control.
  'tap-hotspot': UnsupportedRenderer,
  qte: UnsupportedRenderer,
};
