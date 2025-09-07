import React, { createContext, useContext, useState } from 'react';
import { useDispatch, useSelect } from '@wordpress/data';
import { v4 as uuidv4 } from 'uuid';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { EmailSection, EmailBlock } from '../../stores/email-builder/types';
import { BlockType, LayoutTemplate } from '../types';
import { blocksRegistry } from '../blocks/BlockRegister';
import * as emailBuilderApi from '../../api/email-builder-api';

interface BuilderContextType {
	// Section operations
	addNewSection: (sectionType: LayoutTemplate) => void;
	deleteSection: (sectionId: string) => void;
	reorderSections: (activeSectionId: string, overSectionId: string) => void;

	// Block operations
	addNewBlock: (
		sectionId: string,
		columnId: string,
		blockType: BlockType,
		index?: number
	) => void;
	addNewBlockWithProps: (
		sectionId: string,
		columnId: string,
		blockType: BlockType,
		props: Record<string, any>,
		index?: number
	) => void;
	updateBlock: (blockId: string, props: Record<string, any>) => void;
	deleteBlock: (blockId: string) => void;
	moveBlock: (
		blockId: string,
		fromSectionId: string,
		fromColumnId: string,
		toSectionId: string,
		toColumnId: string,
		toIndex: number
	) => void;

	// Selection operations
	selectBlock: (
		blockId: string,
		sectionId?: string,
		columnId?: string
	) => void;
	clearSelection: () => void;

	// Template operations
	saveTemplate: (name: string, subject?: string) => Promise<any>;
	updateTemplate: (
		id: number,
		name: string,
		subject?: string
	) => Promise<any>;

	// State
	saving: boolean;
	error: Error | null;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export const BuilderProvider: React.FC<{
	children: React.ReactNode;
	templateId?: number;
}> = ({ children, templateId }) => {
	const dispatch = useDispatch();
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	// Get the current sections from the store
	const sections = useSelect((select) => select(STORE_KEY).getSections());

	const addNewSection = (sectionType: LayoutTemplate) => {
		const newSection: EmailSection = {
			id: uuidv4(),
			columns: sectionType.number.map((width) => ({
				id: uuidv4(),
				width,
				blocks: [],
			})),
			styles: {
				backgroundColor: '#fff',
				padding: '20px',
			},
		};
		dispatch(STORE_KEY).addSection(newSection);
	};

	const addNewBlock = (
		sectionId: string,
		columnId: string,
		blockType: BlockType,
		index?: number
	) => {
		const newBlock: EmailBlock = {
			id: uuidv4(),
			type: blockType,
			props: blocksRegistry[blockType]?.defaultProps || {},
		};
		dispatch(STORE_KEY).addBlock(sectionId, columnId, newBlock, index);
	};

	const addNewBlockWithProps = (
		sectionId: string,
		columnId: string,
		blockType: BlockType,
		props: Record<string, any>,
		index?: number
	) => {
		const newBlock: EmailBlock = {
			id: uuidv4(),
			type: blockType,
			props: props,
		};
		dispatch(STORE_KEY).addBlock(sectionId, columnId, newBlock, index);
	};

	const updateBlock = (blockId: string, props: Record<string, any>) => {
		dispatch(STORE_KEY).updateBlock(blockId, props);
	};

	const deleteBlock = (blockId: string) => {
		dispatch(STORE_KEY).deleteBlock(blockId);
	};

	const deleteSection = (sectionId: string) => {
		dispatch(STORE_KEY).deleteSection(sectionId);
	};

	const reorderSections = (
		activeSectionId: string,
		overSectionId: string
	) => {
		dispatch(STORE_KEY).reorderSections(activeSectionId, overSectionId);
	};

	const moveBlock = (
		blockId: string,
		fromSectionId: string,
		fromColumnId: string,
		toSectionId: string,
		toColumnId: string,
		toIndex: number
	) => {
		dispatch(STORE_KEY).moveBlock(
			blockId,
			fromSectionId,
			fromColumnId,
			toSectionId,
			toColumnId,
			toIndex
		);
	};

	const selectBlock = (
		blockId: string,
		sectionId?: string,
		columnId?: string
	) => {
		dispatch(STORE_KEY).selectBlock(blockId, sectionId, columnId);
	};

	const clearSelection = () => {
		dispatch(STORE_KEY).clearSelection();
	};

	// Save the current template to the backend
	const saveTemplate = async (name: string, subject = '') => {
		try {
			setSaving(true);
			setError(null);

			const template = {
				name,
				subject,
				body: JSON.stringify(sections),
				type: 'email',
				settings: JSON.stringify({
					backgroundColor: '#f7f7f7',
					canvasColor: '#ffffff',
					textColor: '#000000',
					fontFamily: 'Arial, sans-serif',
				}),
			};

			const response = await emailBuilderApi.createTemplate(template);
			return response;
		} catch (error: any) {
			setError(error);
			throw error;
		} finally {
			setSaving(false);
		}
	};

	// Update an existing template
	const updateTemplate = async (id: number, name: string, subject = '') => {
		try {
			setSaving(true);
			setError(null);

			const template = {
				name,
				subject,
				body: JSON.stringify(sections),
				type: 'email',
				settings: JSON.stringify({
					backgroundColor: '#f7f7f7',
					canvasColor: '#ffffff',
					textColor: '#000000',
					fontFamily: 'Arial, sans-serif',
				}),
			};

			const response = await emailBuilderApi.updateTemplate(id, template);
			return response;
		} catch (error: any) {
			setError(error);
			throw error;
		} finally {
			setSaving(false);
		}
	};

	return (
		<BuilderContext.Provider
			value={{
				addNewSection,
				addNewBlock,
				addNewBlockWithProps,
				updateBlock,
				deleteBlock,
				moveBlock,
				deleteSection,
				reorderSections,
				selectBlock,
				clearSelection,
				saveTemplate,
				updateTemplate,
				saving,
				error,
			}}
		>
			{children}
		</BuilderContext.Provider>
	);
};

export const useBuilder = () => {
	const context = useContext(BuilderContext);
	if (!context) {
		throw new Error('useBuilder must be used within a BuilderProvider');
	}
	return context;
};
