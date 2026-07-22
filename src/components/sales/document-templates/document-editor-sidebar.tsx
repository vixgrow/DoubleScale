/**
 * Right sidebar for document create/edit — live preview + style editor.
 */

import type React from 'react';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { DocumentPreviewFrame } from './document-preview-frame';
import { TemplateStyleEditor } from './template-style-editor';
import { TemplateGalleryDialog, type TemplateSelection } from './template-gallery';
import type { DocumentDesignDocType } from './designs/types';
import { getTemplateMeta } from './registry';

import './document-editor-sidebar.scss';

interface DocumentEditorSidebarProps {
	docType: DocumentDesignDocType;
	templateId: number;
	templateColor: string | null;
	onColorChange: (color: string | null) => void;
	onTemplateChange?: (selection: TemplateSelection) => void;
	templateChangeDisabled?: boolean;
	preview: React.ReactNode;
	showStyleEditor?: boolean;
	className?: string;
}

export const DocumentEditorSidebar: React.FC<DocumentEditorSidebarProps> = ({
	docType,
	templateId,
	templateColor,
	onColorChange,
	onTemplateChange,
	templateChangeDisabled = false,
	preview,
	showStyleEditor = true,
	className = '',
}) => {
	const docLabel =
		docType === 'invoice'
			? __('Invoice', 'doublescale')
			: __('Proposal', 'doublescale');
	const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
	const templateMeta = getTemplateMeta(templateId);

	return (
		<aside className={`document-editor-sidebar flex w-full flex-col gap-4 ${className}`}>
			<div className="rounded-xl border border-border bg-white p-4 shadow-sm">
				<h3 className="mb-3 text-base font-semibold text-foreground">
					{__('Template Preview', 'doublescale')}
				</h3>
				<div className="document-editor-sidebar__preview relative">
					<span
						className="document-editor-sidebar__tab"
						aria-hidden
					>
						{docLabel}
					</span>
					<div className="document-editor-sidebar__preview-panel">
						<div className="document-editor-sidebar__preview-scroll max-h-[min(62vh,620px)] overflow-x-hidden overflow-y-auto">
							<DocumentPreviewFrame>
								{preview}
							</DocumentPreviewFrame>
						</div>
					</div>
				</div>
				<div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-center text-xs text-muted-foreground">
					<span>{templateMeta.name}</span>
					{onTemplateChange && !templateChangeDisabled ? (
						<button
							type="button"
							className="text-primary font-medium underline-offset-2 hover:underline"
							onClick={() => setTemplateDialogOpen(true)}
						>
							{__('Change', 'doublescale')}
						</button>
					) : null}
				</div>
			</div>

			{showStyleEditor ? (
				<TemplateStyleEditor
					value={templateColor}
					onChange={onColorChange}
					compact
				/>
			) : null}

			{onTemplateChange ? (
				<TemplateGalleryDialog
					open={templateDialogOpen}
					onOpenChange={setTemplateDialogOpen}
					docType={docType}
					value={templateId}
					colorValue={templateColor}
					onSelect={(selection) => {
						onTemplateChange(selection);
						setTemplateDialogOpen(false);
					}}
				/>
			) : null}
		</aside>
	);
};
