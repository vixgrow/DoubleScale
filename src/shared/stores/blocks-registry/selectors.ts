import type { BlocksRegistryState } from './types';

export const getBlocks = (state: BlocksRegistryState): Record<string, any> => {
  return state.blocks;
};

export const getBlock = (
  state: BlocksRegistryState,
  blockType: string
): any | undefined => {
  return state.blocks[blockType];
};

