import type { BlockDefinition } from '../../builder/blocks/blockRegistryUtils';

export interface BlocksRegistryState {
  blocks: Record<string, BlockDefinition>;
}

export interface RegisterBlocksAction {
  type: 'REGISTER_BLOCKS';
  blocks: Record<string, BlockDefinition>;
}

export type BlocksRegistryActionTypes = RegisterBlocksAction;

