/**
 * Block Registry Utilities - Plugin-Based Architecture
 * 
 * Supports separate Free and Pro WordPress plugins where:
 * - Free plugin registers core blocks
 * - Pro plugin extends registry when activated
 * - Missing blocks fallback to UnknownBlock with data preservation
 */

export interface BlockDefinition {
	type: string;
	name: string;
	icon: React.FC<any>;
	defaultProps: any;
	Renderer: React.FC<any>;
	Editor: React.FC<any>;
	isProActivated?: boolean;
	isPro: boolean;
}

export interface BlockRegistry {
	[key: string]: BlockDefinition;
}

export interface UnknownBlockInfo {
	originalType: string;
	originalProps: Record<string, any>;
}

/**
 * Gets a block from the registry with fallback to UnknownBlock
 * 
 * @param blockType - The block type to retrieve
 * @param registry - The blocks registry
 * @param unknownBlock - Fallback block definition
 * @returns Object with block definition and whether it's unknown
 */
export const getBlockDefinition = (
	blockType: string,
	registry: BlockRegistry,
	unknownBlock: BlockDefinition
): {
	block: BlockDefinition;
	isUnknown: boolean;
	info?: UnknownBlockInfo;
} => {
	// Check if block type is missing/empty
	if (!blockType || blockType.trim() === '') {
		return {
			block: unknownBlock,
			isUnknown: true,
			info: {
				originalType: blockType || '',
				originalProps: {},
			},
		};
	}

	const blockDef = registry[blockType];

	// Block not found in registry (Pro plugin not installed, block removed, etc.)
	if (!blockDef) {
		return {
			block: unknownBlock,
			isUnknown: true,
			info: {
				originalType: blockType,
				originalProps: {},
			},
		};
	}

	// Check if block is marked as Pro (check the isPro property from registration)
	// This allows blocks like 'banner' to show as UnknownBlock if isPro: true
	if (blockDef.isPro && !blockDef.isProActivated) {
		return {
			block: unknownBlock,
			isUnknown: true,
			info: {
				originalType: blockType,
				originalProps: {},
			},
		};
	}

	// Block is available and not a Pro block
	return {
		block: blockDef,
		isUnknown: false,
	};
};

/**
 * Checks if a block type exists in the registry
 */
export const blockExists = (
	blockType: string,
	registry: BlockRegistry
): boolean => {
	return blockType in registry && blockType !== 'unknown';
};

/**
 * Gets draggable blocks for sidebar (excludes system blocks)
 * System blocks: 'unknown'
 * 'text' is excluded so it is not offered as an "add" block in the palette
 * (existing text blocks in templates/emails still render and edit normally).
 */
export const getDraggableBlocks = (registry: BlockRegistry): BlockRegistry => {
	const systemBlocks = ['unknown', 'text'];
	return Object.keys(registry).reduce((acc, key) => {
		if (!systemBlocks.includes(key)) {
			acc[key] = registry[key];
		}
		return acc;
	}, {} as BlockRegistry);
};
