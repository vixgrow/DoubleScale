/**
 * Template gallery for invoices and proposals.
 */

import React, { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { normalizeTemplateColor } from './color-presets';
import {
	DOCUMENT_TEMPLATES,
	DEFAULT_TEMPLATE_ID,
	getTemplateMeta,
	normalizeTemplateId,
	type DocumentTemplateMeta,
} from './registry';
import { TemplatePreviewPanel } from './template-preview-panel';
import { TemplateStyleEditor } from './template-style-editor';

export type TemplateDocType = 'invoice' | 'proposal';

export interface TemplateSelection {
	templateId: number;
	templateColor: string | null;
}

interface TemplateGalleryProps {
	docType: TemplateDocType;
	value?: number;
	colorValue?: string | null;
	onSelect: (selection: TemplateSelection) => void;
	onCancel?: () => void;
}

const thumbFor = (tpl: DocumentTemplateMeta, docType: TemplateDocType) =>
	docType === 'invoice' ? tpl.invoiceThumb : tpl.proposalThumb;

const TemplateCardGrid: React.FC<{
	docType: TemplateDocType;
	selectedId: number;
	onPick: (id: number) => void;
	columns?: string;
}> = ({ docType, selectedId, onPick, columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' }) => (
	<div className={`grid gap-4 ${columns}`}>
		{DOCUMENT_TEMPLATES.map((tpl) => {
			const isSelected = selectedId === tpl.id;
			return (
				<button
					key={tpl.id}
					type="button"
					onClick={() => onPick(tpl.id)}
					className={`group relative overflow-hidden rounded-xl border bg-white text-left transition ${
						isSelected
							? 'border-primary ring-2 ring-primary/30'
							: 'border-border hover:border-primary/50'
					}`}
				>
					<div className="aspect-[600/840] overflow-hidden bg-[#f8fafc]">
						<img
							src={thumbFor(tpl, docType)}
							alt={tpl.name}
							className="h-full w-full object-cover object-top"
						/>
					</div>
					<div className="flex items-center justify-between gap-2 px-3 py-2.5">
						<span className="text-sm font-medium text-foreground">
							{tpl.name}
						</span>
						<span className="text-xs text-muted-foreground">#{tpl.id}</span>
					</div>
					<div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/45 via-transparent to-transparent p-3 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
						<span className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow">
							{__('Select', 'doublescale')}
						</span>
					</div>
				</button>
			);
		})}
	</div>
);

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
	docType,
	value,
	colorValue = null,
	onSelect,
	onCancel,
}) => {
	const initialId = normalizeTemplateId(value ?? DEFAULT_TEMPLATE_ID);
	const [selectedId, setSelectedId] = useState(initialId);
	const [draftColor, setDraftColor] = useState<string | null>(
		normalizeTemplateColor(colorValue)
	);

	useEffect(() => {
		setSelectedId(normalizeTemplateId(value ?? DEFAULT_TEMPLATE_ID));
	}, [value]);

	useEffect(() => {
		setDraftColor(normalizeTemplateColor(colorValue));
	}, [colorValue]);

	const continueWithSelection = () => {
		onSelect({
			templateId: selectedId,
			templateColor: normalizeTemplateColor(draftColor),
		});
	};

	return (
		<div className="flex min-h-0 flex-col gap-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold text-foreground">
					{__('Select Template', 'doublescale')}
				</h1>
				<p className="text-sm text-muted-foreground">
					{__(
						'Choose a design and accent color. You can change both later while editing.',
						'doublescale'
					)}
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
				<TemplateCardGrid
					docType={docType}
					selectedId={selectedId}
					onPick={setSelectedId}
				/>
				<div className="flex flex-col gap-4">
					<TemplatePreviewPanel
						docType={docType}
						templateId={selectedId}
						accentColor={draftColor}
					/>
					<TemplateStyleEditor
						value={draftColor}
						onChange={setDraftColor}
						compact
					/>
				</div>
			</div>

			<div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-background/95 px-1 py-3 backdrop-blur">
				<span className="text-sm text-muted-foreground">
					{getTemplateMeta(selectedId).name}
				</span>
				<div className="flex flex-wrap gap-2">
					{onCancel ? (
						<Button type="button" variant="outline" onClick={onCancel}>
							{__('Cancel', 'doublescale')}
						</Button>
					) : null}
					<Button type="button" onClick={continueWithSelection}>
						{__('Continue', 'doublescale')}
					</Button>
				</div>
			</div>
		</div>
	);
};

interface TemplateGalleryDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	docType: TemplateDocType;
	value?: number;
	colorValue?: string | null;
	onSelect: (selection: TemplateSelection) => void;
}

export const TemplateGalleryDialog: React.FC<TemplateGalleryDialogProps> = ({
	open,
	onOpenChange,
	docType,
	value,
	colorValue = null,
	onSelect,
}) => {
	const initialId = normalizeTemplateId(value ?? DEFAULT_TEMPLATE_ID);
	const [selectedId, setSelectedId] = useState(initialId);
	const [draftColor, setDraftColor] = useState<string | null>(
		normalizeTemplateColor(colorValue)
	);

	useEffect(() => {
		if (open) {
			setSelectedId(normalizeTemplateId(value ?? DEFAULT_TEMPLATE_ID));
			setDraftColor(normalizeTemplateColor(colorValue));
		}
	}, [open, value, colorValue]);

	const apply = () => {
		onSelect({
			templateId: selectedId,
			templateColor: normalizeTemplateColor(draftColor),
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-h-[90vh] max-w-6xl overflow-y-auto bg-white z-[150220]"
				overlayClassName="z-[150210] bg-black/45 backdrop-blur-[1px]"
			>
				<DialogHeader>
					<DialogTitle>{__('Change Design', 'doublescale')}</DialogTitle>
					<DialogDescription>
						{__(
							'Pick a template and accent color for this document.',
							'doublescale'
						)}
					</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,1fr)]">
					<TemplateCardGrid
						docType={docType}
						selectedId={selectedId}
						onPick={setSelectedId}
						columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3"
					/>
					<div className="flex flex-col gap-4">
						<TemplatePreviewPanel
							docType={docType}
							templateId={selectedId}
							accentColor={draftColor}
						/>
						<TemplateStyleEditor
							value={draftColor}
							onChange={setDraftColor}
							compact
						/>
					</div>
				</div>

				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button type="button" onClick={apply}>
						{__('Apply', 'doublescale')}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

interface DesignPickerRowProps {
	docType: TemplateDocType;
	templateId: number;
	templateColor?: string | null;
	disabled?: boolean;
	onChange: (selection: TemplateSelection) => void;
}

export const DesignPickerRow: React.FC<DesignPickerRowProps> = ({
	docType,
	templateId,
	templateColor = null,
	disabled,
	onChange,
}) => {
	const [open, setOpen] = useState(false);
	const meta = getTemplateMeta(templateId);

	return (
		<>
			<div className="flex flex-wrap items-center gap-2 text-sm">
				<span className="text-muted-foreground">
					{__('Design:', 'doublescale')}
				</span>
				<span className="font-medium text-foreground">{meta.name}</span>
				{templateColor ? (
					<span
						className="inline-block h-4 w-4 rounded border border-border"
						style={{ backgroundColor: templateColor }}
						title={templateColor}
					/>
				) : null}
				{disabled ? null : (
					<button
						type="button"
						className="text-primary underline-offset-2 hover:underline"
						onClick={() => setOpen(true)}
					>
						{__('Change', 'doublescale')}
					</button>
				)}
			</div>
			<TemplateGalleryDialog
				open={open}
				onOpenChange={setOpen}
				docType={docType}
				value={templateId}
				colorValue={templateColor}
				onSelect={onChange}
			/>
		</>
	);
};
