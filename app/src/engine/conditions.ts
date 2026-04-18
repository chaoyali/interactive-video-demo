import type { Condition } from '@ivd/shared';
import type { Flags } from './types';

export function evaluateCondition(cond: Condition, flags: Flags): boolean {
  switch (cond.op) {
    case 'eq':
      return flags[cond.flag] === cond.value;
    case 'neq':
      return flags[cond.flag] !== cond.value;
    case 'all':
      return cond.conditions.every((c) => evaluateCondition(c, flags));
    case 'any':
      return cond.conditions.some((c) => evaluateCondition(c, flags));
  }
}
