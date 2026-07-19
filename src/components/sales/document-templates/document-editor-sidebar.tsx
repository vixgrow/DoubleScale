/**
 * Right sidebar for document create/edit — live preview + style editor.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { DocumentPreviewFrame } from './document-preview-frame';
import { TemplateStyleEditor } from './template-style-editor';
import type { DocumentDesignDocType } from './designs/types';
import { getTemplateMeta } from './registry';

import './document-editor-sidebar.scss';

interface DocumentEditorSidebarProps {
	docType: DocumentDesignDocType;
	templateId: number;
	templateColor: string | null;
	onColorChange: (color: string | null) => void;
	preview: React.ReactNode;
	showStyleEditor?: boolean;
	className?: string;
}

export const DocumentEditorSidebar: React.FC<DocumentEditorSidebarProps> = ({
	docType,
	templateId,
	templateColor,
	onColorChange,
	preview,
	showStyleEditor = true,
	className = '',
}) => {
	const docLabel =
		docType === 'invoice'
			? __('Invoice', 'doublescale')
			: __('Proposal', 'doublescale');

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
						<div className="document-editor-sidebar__preview-scroll max-h-[min(58vh,560px)] overflow-x-hidden overflow-y-auto">
							<DocumentPreviewFrame>
								{preview}
							</DocumentPreviewFrame>
						</div>
					</div>
				</div>
				<p className="mt-2 text-center text-xs text-muted-foreground">
					{getTemplateMeta(templateId).name}
				</p>
			</div>

			{showStyleEditor ? (
				<TemplateStyleEditor
					value={templateColor}
					onChange={onColorChange}
					compact
				/>
			) : null}
		</aside>
	);
};
