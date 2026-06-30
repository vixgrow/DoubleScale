/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	SavedBlock,
	SavedBlockCategory,
	SavedBlockContent,
} from '../types/common';

interface SavedBlocksListResponse {
	blocks: SavedBlock[];
	total: number;
	pages: number;
	page: number;
	per_page: number;
}

/**
 * Get saved blocks for the current user.
 */
export const getSavedBlocks = async (params?: {
	category?: SavedBlockCategory;
	search?: string;
}): Promise<SavedBlock[]> => {
	try {
		const queryParams = new URLSearchParams();

		if (params?.category) {
			queryParams.append('category', params.category);
		}

		if (params?.search) {
			queryParams.append('search', params.search);
		}

		const path = queryParams.toString()
			? `/doublescale/v1/saved-blocks?${queryParams.toString()}`
			: '/doublescale/v1/saved-blocks';

		const response = await apiFetch({ path });
		const data = response as SavedBlocksListResponse;

		return data.blocks ?? [];
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(
			errorMessage || __('Failed to fetch saved blocks', 'doublescale')
		);
	}
};

/**
 * Create a new saved block.
 */
export const createSavedBlock = async (blockData: {
	name: string;
	category: SavedBlockCategory;
	content: SavedBlockContent;
	thumbnail?: string;
}): Promise<SavedBlock> => {
	try {
		const response = await apiFetch({
			path: '/doublescale/v1/saved-blocks',
			method: 'POST',
			data: blockData,
		});
		return response as SavedBlock;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(
			errorMessage || __('Failed to save block', 'doublescale')
		);
	}
};

/**
 * Delete a saved block.
 */
export const deleteSavedBlock = async (id: number): Promise<void> => {
	try {
		await apiFetch({
			path: `/doublescale/v1/saved-blocks/${id}`,
			method: 'DELETE',
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(
			errorMessage || __('Failed to delete saved block', 'doublescale')
		);
	}
};
