/**
 * QuillForms Dependencies
 */
import type { FormBlocks, FormBlock } from '@quillforms/types';

/**
 * External Dependencies
 */
import { forEach, size } from 'lodash';

/**
 * Internal Dependencies
 */
import { State } from './reducer';
/**
 * Returns form blocks objects.
 *
 * Note: it's important to memoize this selector to avoid return a new instance on each call. We use the block cache state
 * for each top-level block of the given block id. This way, the selector only refreshes
 * on changes to blocks associated with the given entity
 *
 * @param {State} state Editor state.
 *
 * @return {FormBlocks} Form blocks.
 */
export const getBlocks = (state: State): FormBlocks => {
	return state.blocks;
};

/**
 * Returns all form blocks including inner blocks.
 *
 *
 * @param {State} state Editor state.
 *
 * @return {FormBlocks} Form blocks.
 */
export const getAllBlocks = (state: State): FormBlocks => {
	const blocks = state.blocks;
	const allBlocks: FormBlocks = [];
	if (size(blocks) > 0) {
		forEach(blocks, (block) => {
			allBlocks.push(block);
			if (size(block?.innerBlocks) > 0) {
				forEach(block.innerBlocks, (innerBlock) => {
					allBlocks.push(innerBlock);
				});
			}
		});
	}

	return allBlocks;
};

/**
 * Get block by id
 *
 * @param {State}  state       Global application state.
 * @param {string} id          Block id
 *
 * @param          blockId
 * @param          parentIndex
 * @return {FormBlock} Block object
 */
export const getBlockById = (
	state: State,
	blockId: string,
	parentIndex: number | undefined = undefined
): FormBlock | undefined => {
	if (typeof parentIndex === 'undefined') {
		const block = state.blocks.find(($block) => $block.id === blockId);
		if (!block) return undefined;
		return block;
	}

	if (
		!state.blocks ||
		!state.blocks[parentIndex] ||
		!state.blocks[parentIndex].innerBlocks
	) {
		return undefined;
	}
	const block = state.blocks[parentIndex].innerBlocks?.find(
		($block) => $block.id === blockId
	);
	if (!block) return undefined;
	return block;
};

/**
 * Returns the current block id
 *
 * @param {State} state  Global application state.
 *
 * @param         parent
 * @return {?string} Current block id
 */
export function getCurrentBlockId(state: State): string | undefined {
	return state.currentBlockId;
}

/**
 * Returns the current child block id
 *
 * @param {State} state Global application state.
 *
 * @return {?string} Current child block id
 */
export function getCurrentChildBlockId(state: State): string | undefined {
	return state.currentChildBlockId;
}

/**
 * Returns the current block index
 *
 * @param {State} state Global application state.
 *
 * @return {number} Current block index
 */
export function getCurrentBlockIndex(state: State): number {
	return state.blocks.findIndex(
		(item) => item.id === state.currentBlockId
	);
}

/**
 * Returns the current child block index
 *
 * @param {State} state Global application state.
 *
 * @return {number | undefined } Current block index
 */
export function getCurrentChildBlockIndex(state: State): number | undefined {
	const parentBlockIndex = getCurrentBlockIndex(state);
	if (
		!state.blocks ||
		state.blocks.length === 0 ||
		typeof parentBlockIndex === 'undefined' ||
		!state.blocks[parentBlockIndex]
	) {
		return undefined;
	}
	return state.blocks[parentBlockIndex]?.innerBlocks?.findIndex(
		(item) => item.id === state.currentChildBlockId
	);
}

/**
 * Returns the current form item
 *
 * @param {State} state Global application state.
 *
 * @return {FormBlock} Current block item
 */
export function getCurrentBlock(state: State): FormBlock | undefined {
	let currentBlock;
	const currentBlockIndex = state.blocks.findIndex(
		(item) => item.id === state.currentBlockId
	);
	if (currentBlockIndex !== -1)
		currentBlock = state.blocks[currentBlockIndex];
	return currentBlock;
}
