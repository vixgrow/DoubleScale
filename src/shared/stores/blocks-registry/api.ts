/**
 * Blocks Registry API
 * 
 * Public API for accessing and managing the blocks registry.
 * This provides a clean abstraction over the WordPress data store.
 */

import { dispatch, select, useSelect } from '@wordpress/data';
import type { BlockDefinition } from '@/builder/blocks/blockRegistryUtils';
import { STORE_KEY } from './constants';

/**
 * Hook: Get all registered blocks (React components)
 * Automatically updates when blocks are registered
 */
export const useRegisteredBlocks = () => {
  return useSelect((select) => select(STORE_KEY).getBlocks(), []);
};

/**
 * Get all registered blocks (non-React contexts)
 */
export const getRegisteredBlocks = (): Record<string, BlockDefinition> => {
  return select(STORE_KEY).getBlocks();
};

/**
 * Get a specific block by type (non-React contexts)
 */
export const getRegisteredBlock = (blockType: string): BlockDefinition | undefined => {
  return select(STORE_KEY).getBlock(blockType);
};

/**
 * Register new blocks or override existing ones
 * Used by Pro plugin to extend the registry
 */
export const registerBlocks = (blocks: Record<string, BlockDefinition>): void => {
  dispatch(STORE_KEY).registerBlocks(blocks);
};

