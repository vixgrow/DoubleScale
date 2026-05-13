import type { Reducer } from 'redux';

import {
	ADD_BLOCK,
	ADD_SECTION,
	CLEAR_SELECTION,
	DELETE_BLOCK,
	DELETE_SECTION,
	MOVE_BLOCK,
	REDO,
	REORDER_SECTIONS,
	RESET_BUILDER,
	SELECT_BLOCK,
	SET_BUILDER_STATE,
	SET_BUTTON_SETTINGS,
	SET_LOADING,
	UNDO,
	UPDATE_BLOCK,
	UPDATE_BUTTON_SETTINGS,
	UPDATE_GLOBAL_SETTINGS,
	UPDATE_SECTION,
} from './constants';

import type {
	EmailBlock,
	EmailBuilderActionTypes,
	EmailBuilderState,
	EmailSection,
} from './types';

// Initial state
const initialState: EmailBuilderState = {
	sections: [],
	selectedBlockId: null,
	selectedSectionId: null,
	selectedColumnId: null,
	draggedBlock: null,
	isLoading: false,
	globalSettings: {
		canvasColor: '#ffffff',
		backgroundImage: null,
		backgroundRepeat: 'no-repeat',
		backgroundSize: 'cover',
		backgroundPosition: 'center',
		canvasWidth: 900,
	},
	buttonSettings: {
		primary: {
			font: 'Arial, sans-serif',
			size: 16,
			letterSpacing: '0px',
			borderRadius: 4,
			textColor: '#ffffff',
			backgroundColor: '#1e398a',
			borderWidth: 0,
			borderColor: '#1e398a',
			padding: { top: 6, right: 8, bottom: 6, left: 8 },
			bold: false,
			italic: false,
			underline: false,
			strikethrough: false,
		},
		secondary: {
			font: 'Arial, sans-serif',
			size: 16,
			letterSpacing: '0px',
			borderRadius: 4,
			textColor: '#1e398a',
			backgroundColor: 'transparent',
			borderWidth: 1,
			borderColor: '#1e398a',
			padding: { top: 6, right: 8, bottom: 6, left: 8 },
			bold: false,
			italic: false,
			underline: false,
			strikethrough: false,
		},
		tertiary: {
			font: 'Arial, sans-serif',
			size: 16,
			letterSpacing: '0px',
			borderRadius: 0,
			textColor: '#1e398a',
			backgroundColor: '#ffffff',
			borderWidth: 0,
			borderColor: 'transparent',
			padding: { top: 6, right: 8, bottom: 6, left: 8 },
			bold: false,
			italic: false,
			underline: false,
			strikethrough: false,
		},
	},
	history: {
		past: [],
		present: [],
		future: [],
	},
};

// Helper function to find and update a block
const updateBlockInSections = (
	sections: EmailSection[],
	blockId: string,
	updater: (block: EmailBlock) => EmailBlock
): EmailSection[] => {
	return sections.map((section) => ({
		...section,
		columns: section.columns.map((column) => ({
			...column,
			blocks: column.blocks.map((block) =>
				block.id === blockId ? updater(block) : block
			),
		})),
	}));
};

// Helper function to remove a block from sections
const removeBlockFromSections = (
	sections: EmailSection[],
	blockId: string
): EmailSection[] => {
	return sections.map((section) => ({
		...section,
		columns: section.columns.map((column) => ({
			...column,
			blocks: column.blocks.filter((block) => block.id !== blockId),
		})),
	}));
};

// Helper function to add history entry
const addToHistory = (
	state: EmailBuilderState,
	newSections: EmailSection[]
): EmailBuilderState => {
	return {
		...state,
		sections: newSections,
		history: {
			past: [...state.history.past, state.sections],
			present: newSections,
			future: [], // Clear future when new action is performed
		},
	};
};

const reducer: Reducer<EmailBuilderState, EmailBuilderActionTypes> = (
	state = initialState,
	action
): EmailBuilderState => {
	switch (action.type) {
		case ADD_BLOCK: {
			const { sectionId, columnId, block, index } = action.payload;

			const newSections = state.sections.map((section) => {
				if (section.id !== sectionId) return section;

				return {
					...section,
					columns: section.columns.map((column) => {
						if (column.id !== columnId) return column;

						const newBlocks = [...column.blocks];
						const insertIndex =
							index !== undefined ? index : newBlocks.length;
						newBlocks.splice(insertIndex, 0, block);

						return {
							...column,
							blocks: newBlocks,
						};
					}),
				};
			});

			return addToHistory(state, newSections);
		}

		case UPDATE_BLOCK: {
			const { blockId, props } = action.payload;

			const newSections = updateBlockInSections(
				state.sections,
				blockId,
				(block) => ({
					...block,
					props: { ...block.props, ...props },
				})
			);

			return addToHistory(state, newSections);
		}

		case DELETE_BLOCK: {
			const { blockId } = action.payload;
			const newSections = removeBlockFromSections(
				state.sections,
				blockId
			);

			return {
				...addToHistory(state, newSections),
				selectedBlockId:
					state.selectedBlockId === blockId
						? null
						: state.selectedBlockId,
			};
		}

		case MOVE_BLOCK: {
			const {
				blockId,
				fromSectionId,
				fromColumnId,
				toSectionId,
				toColumnId,
				toIndex,
			} = action.payload;

			// First, find and remove the block
			let blockToMove: EmailBlock | null = null;
			const sectionsAfterRemoval = state.sections.map((section) => {
				if (section.id !== fromSectionId) return section;

				return {
					...section,
					columns: section.columns.map((column) => {
						if (column.id !== fromColumnId) return column;

						const blockIndex = column.blocks.findIndex(
							(block) => block.id === blockId
						);
						if (blockIndex !== -1) {
							blockToMove = column.blocks[blockIndex];
							return {
								...column,
								blocks: column.blocks.filter(
									(block) => block.id !== blockId
								),
							};
						}
						return column;
					}),
				};
			});

			if (!blockToMove) return state;

			// Then, add the block to the new location
			const newSections = sectionsAfterRemoval.map((section) => {
				if (section.id !== toSectionId) return section;

				return {
					...section,
					columns: section.columns.map((column) => {
						if (column.id !== toColumnId) return column;

						const newBlocks = [...column.blocks];
						newBlocks.splice(toIndex, 0, blockToMove!);

						return {
							...column,
							blocks: newBlocks,
						};
					}),
				};
			});

			return addToHistory(state, newSections);
		}

		case SELECT_BLOCK: {
			const { blockId, sectionId, columnId } = action.payload;
			return {
				...state,
				selectedBlockId: blockId,
				selectedSectionId: sectionId || state.selectedSectionId,
				selectedColumnId: columnId || state.selectedColumnId,
			};
		}

		case CLEAR_SELECTION: {
			return {
				...state,
				selectedBlockId: null,
				selectedSectionId: null,
				selectedColumnId: null,
			};
		}

		case ADD_SECTION: {
			const { section, index } = action.payload;
			const newSections = [...state.sections];
			const insertIndex =
				index !== undefined ? index : newSections.length;
			newSections.splice(insertIndex, 0, section);

			return addToHistory(state, newSections);
		}

		case DELETE_SECTION: {
			const { sectionId } = action.payload;
			const newSections = state.sections.filter(
				(section) => section.id !== sectionId
			);

			return {
				...addToHistory(state, newSections),
				selectedSectionId:
					state.selectedSectionId === sectionId
						? null
						: state.selectedSectionId,
			};
		}

		case UPDATE_SECTION: {
			const { sectionId, styles, conditions } = action.payload;
			const newSections = state.sections.map((section) => {
				if (section.id === sectionId) {
					const updatedSection = { ...section };
					if (styles) {
						updatedSection.styles = { ...section.styles, ...styles };
					}
					if (conditions !== undefined) {
						updatedSection.conditions = conditions;
					}
					return updatedSection;
				}
				return section;
			});

			return addToHistory(state, newSections);
		}

		case REORDER_SECTIONS: {
			const { activeSectionId, overSectionId } = action.payload;

			// Find the indices of the sections
			const activeSectionIndex = state.sections.findIndex(
				(section) => section.id === activeSectionId
			);
			const overSectionIndex = state.sections.findIndex(
				(section) => section.id === overSectionId
			);

			if (activeSectionIndex === -1 || overSectionIndex === -1) {
				return state;
			}

			// Create a new array with reordered sections
			const newSections = [...state.sections];
			const [movedSection] = newSections.splice(activeSectionIndex, 1);
			newSections.splice(overSectionIndex, 0, movedSection);

			return addToHistory(state, newSections);
		}

		case SET_BUILDER_STATE: {
			const { sections } = action.payload;
			return {
				...state,
				sections,
				history: {
					...state.history,
					present: sections,
				},
			};
		}

		case RESET_BUILDER: {
			return initialState;
		}

		case UPDATE_GLOBAL_SETTINGS: {
			const { settings } = action.payload;
			return {
				...state,
				globalSettings: {
					...state.globalSettings,
					...settings,
				},
			};
		}

		case UNDO: {
			const { past, present, future } = state.history;
			if (past.length === 0) {
				return state; // Nothing to undo
			}

			const previous = past[past.length - 1];
			const newPast = past.slice(0, past.length - 1);

			return {
				...state,
				sections: previous,
				history: {
					past: newPast,
					present: previous,
					future: [present, ...future],
				},
			};
		}

		case REDO: {
			const { past, present, future } = state.history;
			if (future.length === 0) {
				return state; // Nothing to redo
			}

			const next = future[0];
			const newFuture = future.slice(1);

			return {
				...state,
				sections: next,
				history: {
					past: [...past, present],
					present: next,
					future: newFuture,
				},
			};
		}

		case UPDATE_BUTTON_SETTINGS: {
			const { buttonType, settings } = action.payload;
			return {
				...state,
				buttonSettings: {
					...state.buttonSettings,
					[buttonType]: {
						...state.buttonSettings[buttonType],
						...settings,
					},
				},
			};
		}

		case SET_BUTTON_SETTINGS: {
			const { settings } = action.payload;
			return {
				...state,
				buttonSettings: settings,
			};
		}

		case SET_LOADING: {
			const { isLoading } = action.payload;
			return {
				...state,
				isLoading,
			};
		}

		default:
			return state;
	}
};

export default reducer;
export type State = EmailBuilderState;
