import React from 'react';
import { useRegisteredBlocks } from '@/stores/blocks-registry';
import { getBlockDefinition } from '../blocks/blockRegistryUtils';
import TemplateCard from './TemplateCard';
import { EmailBlock } from '../../stores/email-builder/types';

interface ActiveItem {
	type: string;
	block?: EmailBlock;
	template?: {
		type: string;
	};
	item?: any;
	blockType?: string;
}

interface DragOverlayRendererProps {
	activeItem: ActiveItem | null;
}

const TEMPLATE_TITLES: Record<string, Record<string, string>> = {
	'header-template': {
		'single-logo': 'Logo',
		'logo-navigation': 'Logo + Navigation',
		'logo-button': 'Logo + Button',
	},
	'email-body-template': {
		'title-1': 'Title 1',
		'title-2': 'Title 2',
		'title-3': 'Title 3',
		'title-4': 'Title 4',
		'title-button-1': 'Title & Button 1',
		'title-button-2': 'Title & Button 2',
		'title-2-buttons': 'Title & 2 Buttons',
		'title-paragraph-button': 'Title, Paragraph & Button',
	},
	'hero-image-template': {
		'standard-hero': 'Standard Hero',
		'extended-hero': 'Extended Hero',
		'title-image': 'Title + Image',
		'side-by-side': 'Side by Side Image + Text',
	},
	'footer-template': {
		'centered-footer': 'Centered Footer',
		'centered-footer-items': 'Centered Footer & Items',
		'basic-footer': 'Basic Footer',
	},
	'preheader-template': {
		'preheader-template': 'Text & Link',
	},
	'image-gallery-template': {
		'grid-1': 'Grid 1',
		'grid-2': 'Grid 2',
		'grid-3': 'Grid 3',
		'grid-4': 'Grid 4',
		'grid-5': 'Grid 5',
		'grid-6': 'Grid 6',
	},
};

const TEMPLATE_LABELS: Record<string, string> = {
	'library-template': 'Preheader Template',
	'header-template': 'Header Template',
	'email-body-template': 'Email Body Template',
	'hero-image-template': 'Hero Image Template',
	'footer-template': 'Footer Template',
	'preheader-template': 'Preheader Template',
	'image-gallery-template': 'Image Gallery Template',
};

const TemplateOverlay: React.FC<{ title: string; label: string }> = ({
	title,
	label,
}) => (
	<div className="opacity-90 transform rotate-3 shadow-lg bg-white rounded-md border border-blue-300 p-4">
		<div className="text-sm font-medium text-gray-700">{title}</div>
		<div className="text-xs text-gray-500 mt-1">{label}</div>
	</div>
);

const DragOverlayRenderer: React.FC<DragOverlayRendererProps> = ({
	activeItem,
}) => {
	const blocksRegistry = useRegisteredBlocks();

	if (!activeItem) return null;

	const { type, block, template, item, blockType } = activeItem;

	// Handle block overlay
	if (type === 'block' && block) {
		const { block: blockDefinition } = getBlockDefinition(
			block.type,
			blocksRegistry,
			blocksRegistry.unknown
		);
		
		return (
			<div className="opacity-90 transform rotate-3 shadow-lg w-48">
				<TemplateCard
					item={blockDefinition}
					type="element"
					blockType={block.type}
					isDragOverlay={true}
				/>
			</div>
		);
	}

	// Handle library template (special case)
	if (type === 'library-template') {
		return (
			<TemplateOverlay
				title="Text & Link"
				label={TEMPLATE_LABELS[type]}
			/>
		);
	}

	// Handle all other template types
	if (template && TEMPLATE_TITLES[type]) {
		const titles = TEMPLATE_TITLES[type];
		const title = titles[template.type] || TEMPLATE_LABELS[type];
		return <TemplateOverlay title={title} label={TEMPLATE_LABELS[type]} />;
	}

	// Handle generic item overlay
	if (item) {
		return (
			<div className="opacity-90 transform rotate-3 shadow-lg">
				<TemplateCard
					item={item}
					type={type as 'layout' | 'element'}
					blockType={blockType}
					isDragOverlay={true}
				/>
			</div>
		);
	}

	return null;
};

export default DragOverlayRenderer;
