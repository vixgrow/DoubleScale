import type { BlockDefinition } from '@/builder/blocks/blockRegistryUtils';
import { REGISTER_BLOCKS } from './constants';
import type { RegisterBlocksAction } from './types';

export const registerBlocks = (
  blocks: Record<string, BlockDefinition>
): RegisterBlocksAction => {
  return {
    type: REGISTER_BLOCKS,
    blocks,
  };
};

