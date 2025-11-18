/**
 * Common type definitions for the Email Builder
 *
 * This file centralizes all shared types to improve type safety
 * and reduce duplication across the codebase.
 */

// ============================================================================
// Block Types
// ============================================================================

export type BlockType =
	| 'text'
	| 'image'
	| 'button'
	| 'divider'
	| 'social_media'
	| 'html'
	| 'timer'
	| 'video'
	| 'banner'
	| 'menu'
	| 'preheader'
	| 'product';

export interface EmailBlock {
	id: string;
	type: BlockType;
	props: Record<string, unknown>;
}

export interface BlockDefinition<T = any> {
	type: BlockType;
	name: string;
	icon: React.ComponentType<any>;
	defaultProps: T;
	Renderer: React.ComponentType<{ props: T }>;
	Editor: React.ComponentType<{
		props: T;
		onChange: (updates: Partial<T>) => void;
	}>;
	isProActivated?: boolean;
	isPro: boolean;
}

// ============================================================================
// Section & Column Types
// ============================================================================

export interface EmailColumn {
	id: string;
	width: number;
	blocks: EmailBlock[];
}

export interface EmailSection {
	id: string;
	columns: EmailColumn[];
	layout?: LayoutConfig;
	styles?: SectionStyles;
}

export interface SectionStyles {
	backgroundColor?: string;
	backgroundImage?: BackgroundImage;
	backgroundRepeat?: BackgroundRepeat;
	backgroundSize?: BackgroundSize;
	backgroundPosition?: BackgroundPosition;
	padding?: PaddingValue;
}

// ============================================================================
// Template Types
// ============================================================================

export type TemplateType =
	| 'library-template'
	| 'header-template'
	| 'footer-template'
	| 'email-body-template'
	| 'hero-image-template'
	| 'image-gallery-template'
	| 'preheader-template';

export interface TemplateConfig {
	id: string;
	name: string;
	type: TemplateType;
	blocks: BlockConfig[];
	layout?: LayoutConfig;
	preview?: string;
	description?: string;
}

export interface BlockConfig {
	type: BlockType;
	props: Record<string, unknown>;
}

export interface LayoutConfig {
	name: string;
	width: number[];
	value: string;
}

// ============================================================================
// Layout Types
// ============================================================================

export interface LayoutTemplate {
	name: string;
	width: number[];
	value: string;
}

export type LayoutType =
	| 'one-column'
	| 'two-column'
	| 'three-column'
	| 'custom';

// ============================================================================
// Style Types
// ============================================================================

export interface PaddingValue {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export interface BackgroundImage {
	id: number;
	name: string;
	url: string;
	size: number;
}

export type BackgroundRepeat = 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
export type BackgroundSize = 'auto' | 'cover' | 'contain' | 'custom';
export type BackgroundPosition =
	| 'center'
	| 'top'
	| 'bottom'
	| 'left'
	| 'right'
	| 'top-left'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-right';

export type Alignment = 'left' | 'center' | 'right' | 'full';
export type Shape = 'rectangle' | 'rounded' | 'circle';
export type ColorMode = 'original' | 'colored';

// ============================================================================
// Button Types
// ============================================================================

export type ButtonType = 'primary' | 'secondary' | 'tertiary';

export interface ButtonSettings {
	backgroundColor: string;
	textColor: string;
	borderColor: string;
	borderWidth: number;
	borderRadius: number;
	padding: PaddingValue;
	font: string;
	size: number;
	letterSpacing: string;
	bold: boolean;
	italic: boolean;
	underline: boolean;
}

// ============================================================================
// Global Settings Types
// ============================================================================

export interface GlobalSettings {
	backgroundColor: string;
	backgroundImage: BackgroundImage | null;
	backgroundRepeat: BackgroundRepeat;
	backgroundSize: BackgroundSize;
	backgroundPosition: BackgroundPosition;
	padding: PaddingValue;
	buttonSettings: Record<ButtonType, ButtonSettings>;
}

// ============================================================================
// Editor State Types
// ============================================================================

export interface EditorState {
	sections: EmailSection[];
	selectedBlockId: string | null;
	selectedSectionId: string | null;
	globalSettings: GlobalSettings;
	isSaving: boolean;
	lastSaved: Date | null;
	hasUnsavedChanges: boolean;
}

// ============================================================================
// Drag & Drop Types
// ============================================================================

export interface DragData {
	type: DragType;
	blockType?: BlockType;
	template?: TemplateConfig;
	sectionId?: string;
	columnId?: string;
	blockId?: string;
}

export type DragType =
	| 'layout'
	| 'element'
	| 'header-template'
	| 'footer-template'
	| 'email-body-template'
	| 'hero-image-template'
	| 'image-gallery-template'
	| 'preheader-template';

export interface DropTarget {
	id: string;
	type: 'canvas' | 'section' | 'column';
	sectionId?: string;
	columnId?: string;
}

// ============================================================================
// API Types
// ============================================================================

export interface EmailTemplate {
	id: number;
	name: string;
	type: 'email' | 'sms' | 'whatsapp';
	body: string | {
		type: 'builder';
		value: {
			sections: EmailSection[];
			globalSettings: GlobalSettings;
			buttonSettings: Record<ButtonType, ButtonSettings>;
		};
	};
	thumbnail?: string;
	hidden?: boolean;
	created_at: string;
	updated_at: string;
	settings?: EmailTemplateSettings;
}

export interface EmailTemplateSettings {
	from_name: string;
	from_email: string;
	reply_to: string;
	subject: string;
	preview_text: string;
	enable_utm: boolean;
	utm_source: string;
	utm_medium: string;
	utm_name: string;
	utm_term: string;
	utm_content: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
	T,
	Exclude<keyof T, Keys>
> &
	{
		[K in Keys]-?: Required<Pick<T, K>> &
		Partial<Pick<T, Exclude<Keys, K>>>;
	}[Keys];

// ============================================================================
// Component Props Types
// ============================================================================

export interface BaseBlockEditorProps<T> {
	props: T;
	onChange: (updates: Partial<T>) => void;
}

export interface BaseBlockRendererProps<T> {
	props: T;
}

export interface BaseControlProps<T> {
	value: T;
	onChange: (value: T) => void;
	label?: string;
	className?: string;
}
