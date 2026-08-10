/**
 * Reusable section rows editor (title + rich text body).
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Plus, Trash2 } from 'lucide-react';

import { FormField } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/rich-text-editor';
import type { DocumentSection } from '@/types/sales';

interface DocumentSectionsEditorProps {
	sections: DocumentSection[];
	onChange: (sections: DocumentSection[]) => void;
	disabled?: boolean;
	heading?: string;
	emptyMessage?: string;
	addLabel?: string;
}

export const DocumentSectionsEditor: React.FC<DocumentSectionsEditorProps> = ({
	sections,
	onChange,
	disabled = false,
	heading,
	emptyMessage = __(
		'Add custom content blocks with a title and rich text body.',
		'doublescale'
	),
	addLabel = __('Add New Section', 'doublescale'),
}) => (
	<div className="space-y-4">
		{heading ? (
			<h3 className="text-sm font-semibold text-foreground">{heading}</h3>
		) : null}

		{sections.length ? (
			<div className="space-y-4">
				{sections.map((section, index) => (
					<div
						key={`section-${index}`}
						className="rounded-lg border border-border p-4 space-y-3"
					>
						<div className="flex items-start gap-3">
							<FormField
								label={__('Section Title', 'doublescale')}
								className="!mb-0 flex-1"
							>
								<Input
									value={section.title}
									onChange={(e) => {
										const next = [...sections];
										next[index] = { ...next[index], title: e.target.value };
										onChange(next);
									}}
									disabled={disabled}
								/>
							</FormField>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="mt-7 shrink-0"
								onClick={() =>
									onChange(sections.filter((_, i) => i !== index))
								}
								disabled={disabled}
								aria-label={__('Remove section', 'doublescale')}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
						<FormField label={__('Section Content', 'doublescale')} className="!mb-0">
							<div
								className={
									disabled ? 'pointer-events-none opacity-60' : undefined
								}
							>
								<RichTextEditor
									content={section.body}
									onChange={(html) => {
										const next = [...sections];
										next[index] = { ...next[index], body: html };
										onChange(next);
									}}
									placeholder={__('Write section content…', 'doublescale')}
									className="[&_.prose]:min-h-[120px]"
								/>
							</div>
						</FormField>
					</div>
				))}
			</div>
		) : (
			<p className="text-sm text-muted-foreground">{emptyMessage}</p>
		)}

		<Button
			type="button"
			variant="outline"
			className="w-full border-primary text-primary bg-white"
			onClick={() => onChange([...sections, { title: '', body: '' }])}
			disabled={disabled}
		>
			<Plus className="h-4 w-4 mr-1" />
			{addLabel}
		</Button>
	</div>
);
