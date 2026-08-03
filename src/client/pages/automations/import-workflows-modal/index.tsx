/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import React from 'react';
import {
	CheckCircle2,
	FileJson,
	Upload,
	XCircle,
	X,
} from 'lucide-react';

/**
 * Internal dependencies
 */
import {
	CustomDialogHeader,
	GradientAutomationsIcon,
	LoadingSpinner,
} from '@doublescale/components';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import ConfigAPI from '@doublescale/config';
import type { WorkflowImportResult } from '@doublescale/client';

type Step = 'upload' | 'select' | 'progress' | 'done';

type WorkflowCandidate = {
	id: string;
	name: string;
	trigger: string;
	triggerLabel: string;
	envelope: unknown;
};

type ImportFailure = {
	name: string;
	message: string;
};

type ImportWorkflowsModalProps = {
	open: boolean;
	onClose: () => void;
	onImported: (result: {
		imported: number;
		failed: number;
		singleId?: number;
	}) => void;
};

const isSingleWorkflowEnvelope = (
	payload: unknown
): payload is Record<string, unknown> =>
	typeof payload === 'object' &&
	payload !== null &&
	Boolean((payload as Record<string, unknown>)._doublescale_workflow) &&
	typeof (payload as Record<string, unknown>).workflow === 'object';

const isBulkWorkflowEnvelope = (
	payload: unknown
): payload is { workflows: unknown[] } =>
	typeof payload === 'object' &&
	payload !== null &&
	Boolean((payload as Record<string, unknown>)._doublescale_workflows) &&
	Array.isArray((payload as Record<string, unknown>).workflows);

const extractWorkflowEnvelopes = (payloads: unknown[]): unknown[] => {
	const envelopes: unknown[] = [];

	payloads.forEach((payload) => {
		if (isBulkWorkflowEnvelope(payload)) {
			envelopes.push(...payload.workflows);
		} else if (isSingleWorkflowEnvelope(payload)) {
			envelopes.push(payload);
		}
	});

	return envelopes;
};

const getTriggerLabel = (triggerSlug: string): string => {
	if (!triggerSlug) {
		return __('Unknown trigger', 'doublescale');
	}

	const categories = ConfigAPI.getAutomationTriggers?.() ?? {};
	for (const category of Object.values(categories)) {
		const groups = category.groups
			? Array.isArray(category.groups)
				? category.groups
				: Object.values(category.groups)
			: [];

		for (const group of groups) {
			const trigger = group?.triggers?.[triggerSlug];
			if (trigger?.label) {
				return trigger.label;
			}
		}

		if (category.tabs) {
			for (const tab of Object.values(category.tabs)) {
				const tabGroups = Array.isArray(tab.groups)
					? tab.groups
					: Object.values(tab.groups ?? {});
				for (const group of tabGroups) {
					const trigger = group?.triggers?.[triggerSlug];
					if (trigger?.label) {
						return trigger.label;
					}
				}
			}
		}
	}

	return triggerSlug.replace(/_/g, ' ');
};

const getEnvelopeMeta = (
	envelope: unknown,
	index: number
): Omit<WorkflowCandidate, 'envelope'> => {
	const workflow = (envelope as { workflow?: { automation?: Record<string, unknown> } })
		?.workflow;
	const automation = workflow?.automation ?? {};
	const name =
		typeof automation.name === 'string' && automation.name.trim() !== ''
			? automation.name
			: sprintf(
					/* translators: %d: workflow number in the import file */
					__('Untitled workflow %d', 'doublescale'),
					index + 1
				);
	const trigger =
		typeof automation.trigger === 'string' ? automation.trigger : '';

	return {
		id: `wf-${index}-${name}`,
		name,
		trigger,
		triggerLabel: getTriggerLabel(trigger),
	};
};

const formatFileSize = (bytes: number): string => {
	if (bytes === 0) {
		return '0 Bytes';
	}
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const ImportWorkflowsModal: React.FC<ImportWorkflowsModalProps> = ({
	open,
	onClose,
	onImported,
}) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [step, setStep] = useState<Step>('upload');
	const [fileName, setFileName] = useState('');
	const [fileSize, setFileSize] = useState(0);
	const [parseError, setParseError] = useState<string | null>(null);
	const [candidates, setCandidates] = useState<WorkflowCandidate[]>([]);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [processed, setProcessed] = useState(0);
	const [totalToImport, setTotalToImport] = useState(0);
	const [currentName, setCurrentName] = useState('');
	const [importedCount, setImportedCount] = useState(0);
	const [failures, setFailures] = useState<ImportFailure[]>([]);
	const [lastSingleId, setLastSingleId] = useState<number | undefined>();

	const resetState = () => {
		setStep('upload');
		setFileName('');
		setFileSize(0);
		setParseError(null);
		setCandidates([]);
		setSelectedIds([]);
		setIsDragging(false);
		setProcessed(0);
		setTotalToImport(0);
		setCurrentName('');
		setImportedCount(0);
		setFailures([]);
		setLastSingleId(undefined);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	useEffect(() => {
		if (!open) {
			resetState();
		}
	}, [open]);

	const allSelected =
		candidates.length > 0 && selectedIds.length === candidates.length;
	const someSelected =
		selectedIds.length > 0 && selectedIds.length < candidates.length;

	const progressPercentage = useMemo(() => {
		if (totalToImport <= 0) {
			return 0;
		}
		if (step === 'done') {
			return 100;
		}
		return Math.min(
			100,
			Math.round((processed / Math.max(1, totalToImport)) * 100)
		);
	}, [processed, totalToImport, step]);

	const loadFiles = async (files: FileList | File[]) => {
		const list = Array.from(files);
		if (!list.length) {
			return;
		}

		setParseError(null);

		const payloads: unknown[] = [];
		const names: string[] = [];
		let totalBytes = 0;

		for (const file of list) {
			const isJson =
				file.type === 'application/json' ||
				file.type === 'text/json' ||
				file.name.toLowerCase().endsWith('.json');

			if (!isJson) {
				setParseError(
					__('Please select a DoubleScale workflow JSON file.', 'doublescale')
				);
				return;
			}

			names.push(file.name);
			totalBytes += file.size;

			try {
				const text = await file.text();
				payloads.push(JSON.parse(text));
			} catch {
				setParseError(
					__('The selected file is not valid JSON.', 'doublescale')
				);
				return;
			}
		}

		const envelopes = extractWorkflowEnvelopes(payloads);
		if (envelopes.length === 0) {
			setParseError(
				__(
					'No valid workflow exports were found in the selected file(s).',
					'doublescale'
				)
			);
			return;
		}

		const nextCandidates = envelopes.map((envelope, index) => ({
			...getEnvelopeMeta(envelope, index),
			envelope,
		}));

		setFileName(names.join(', '));
		setFileSize(totalBytes);
		setCandidates(nextCandidates);
		setSelectedIds(nextCandidates.map((item) => item.id));
		setStep('select');
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (files?.length) {
			void loadFiles(files);
		}
		event.target.value = '';
	};

	const toggleAll = (checked: boolean) => {
		setSelectedIds(checked ? candidates.map((item) => item.id) : []);
	};

	const toggleOne = (id: string, checked: boolean) => {
		setSelectedIds((prev) =>
			checked ? [...prev, id] : prev.filter((item) => item !== id)
		);
	};

	const runImport = async () => {
		const selected = candidates.filter((item) =>
			selectedIds.includes(item.id)
		);
		if (selected.length === 0) {
			return;
		}

		setStep('progress');
		setProcessed(0);
		setTotalToImport(selected.length);
		setImportedCount(0);
		setFailures([]);
		setLastSingleId(undefined);

		let successCount = 0;
		const nextFailures: ImportFailure[] = [];
		let singleId: number | undefined;

		for (let i = 0; i < selected.length; i++) {
			const item = selected[i];
			setCurrentName(item.name);
			setProcessed(i);

			try {
				const response = (await apiFetch({
					path: '/doublescale/v1/automations/import',
					method: 'POST',
					data: item.envelope,
				})) as WorkflowImportResult;

				successCount += 1;
				singleId = response.id;
				setImportedCount(successCount);
			} catch (error: unknown) {
				const err = error as { message?: string } | null;
				nextFailures.push({
					name: item.name,
					message:
						err?.message ||
						__('Import failed.', 'doublescale'),
				});
				setFailures([...nextFailures]);
			}

			setProcessed(i + 1);
		}

		setLastSingleId(successCount === 1 ? singleId : undefined);
		setImportedCount(successCount);
		setFailures(nextFailures);
		setStep('done');
		onImported({
			imported: successCount,
			failed: nextFailures.length,
			singleId: successCount === 1 ? singleId : undefined,
		});
	};

	const handleClose = () => {
		if (step === 'progress') {
			return;
		}
		onClose();
	};

	const renderUpload = () => (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				{__(
					'Upload a DoubleScale workflow export (.json). You can import one workflow or a bulk export file.',
					'doublescale'
				)}
			</p>
			<div
				className={cn(
					'cursor-pointer rounded-2xl border-2 border-dashed border-border bg-white p-8 text-center transition-colors',
					'hover:border-primary',
					isDragging && 'border-primary bg-primary/5'
				)}
				onClick={() => fileInputRef.current?.click()}
				onDragOver={(event) => {
					event.preventDefault();
					setIsDragging(true);
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={(event) => {
					event.preventDefault();
					setIsDragging(false);
					if (event.dataTransfer.files?.length) {
						void loadFiles(event.dataTransfer.files);
					}
				}}
			>
				<input
					ref={fileInputRef}
					type="file"
					accept="application/json,.json"
					multiple
					className="hidden"
					onChange={handleFileChange}
				/>
				<div className="flex flex-col items-center gap-3">
					<div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F8FA]">
						<Upload className="h-6 w-6 text-primary" />
					</div>
					<div className="space-y-1">
						<h3 className="text-base font-semibold text-foreground">
							{__('Select JSON file to import', 'doublescale')}
						</h3>
						<p className="text-sm text-muted-foreground">
							{__('or drag and drop it here', 'doublescale')}
						</p>
					</div>
				</div>
			</div>
			{parseError && (
				<p className="text-sm text-destructive">{parseError}</p>
			)}
		</div>
	);

	const renderSelect = () => (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-[#F7F8FA] px-4 py-3">
				<div className="flex min-w-0 items-center gap-3">
					<FileJson className="h-5 w-5 shrink-0 text-primary" />
					<div className="min-w-0">
						<p className="truncate text-sm font-medium text-foreground">
							{fileName}
						</p>
						<p className="text-xs text-muted-foreground">
							{formatFileSize(fileSize)} ·{' '}
							{sprintf(
								/* translators: %d: number of workflows found in the file */
								__('%d workflow(s) found', 'doublescale'),
								candidates.length
							)}
						</p>
					</div>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => {
						resetState();
					}}
				>
					{__('Change file', 'doublescale')}
				</Button>
			</div>

			<div className="flex items-center justify-between">
				<label className="flex items-center gap-2 text-sm font-medium text-foreground">
					<Checkbox
						checked={allSelected ? true : someSelected ? 'indeterminate' : false}
						onCheckedChange={(checked) =>
							toggleAll(checked === true)
						}
					/>
					{__('Select all', 'doublescale')}
				</label>
				<span className="text-xs text-muted-foreground">
					{sprintf(
						/* translators: %1$d: selected count, %2$d: total count */
						__('%1$d of %2$d selected', 'doublescale'),
						selectedIds.length,
						candidates.length
					)}
				</span>
			</div>

			<div className="max-h-[320px] space-y-2 overflow-y-auto rounded-xl border border-border p-2">
				{candidates.map((item) => {
					const checked = selectedIds.includes(item.id);
					return (
						<label
							key={item.id}
							className={cn(
								'flex cursor-pointer items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-[#F7F8FA]',
								checked && 'bg-[#F7F8FA]'
							)}
						>
							<Checkbox
								checked={checked}
								onCheckedChange={(value) =>
									toggleOne(item.id, value === true)
								}
								className="mt-0.5"
							/>
							<div className="min-w-0">
								<p className="truncate text-sm font-medium text-foreground">
									{item.name}
								</p>
								<p className="truncate text-xs text-muted-foreground">
									{item.triggerLabel}
								</p>
							</div>
						</label>
					);
				})}
			</div>
		</div>
	);

	const renderProgress = () => (
		<div className="space-y-6 py-2">
			<div className="flex flex-col items-center gap-3 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F8FA]">
					<GradientAutomationsIcon />
				</div>
				<div className="space-y-1">
					<h3 className="text-xl font-semibold text-foreground">
						{__('Importing Automations…', 'doublescale')}
					</h3>
					<p className="text-sm text-muted-foreground">
						{currentName
							? sprintf(
									/* translators: %s: automation name currently being imported */
									__('Importing “%s”', 'doublescale'),
									currentName
								)
							: __(
									'Please wait while we import your workflows…',
									'doublescale'
								)}
					</p>
				</div>
			</div>

			<div className="space-y-2">
				<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
					<LoadingSpinner size={18} />
					<span>{__('In Progress', 'doublescale')}</span>
				</div>
				<Progress value={progressPercentage} className="w-full" />
				<div className="flex justify-between text-xs text-muted-foreground">
					<span>
						{sprintf(
							/* translators: %1$d: processed count, %2$d: total count */
							__('%1$d of %2$d workflows processed', 'doublescale'),
							processed,
							totalToImport
						)}
					</span>
					<span>{progressPercentage}%</span>
				</div>
			</div>
		</div>
	);

	const renderDone = () => (
		<div className="space-y-6 py-2">
			<div className="flex flex-col items-center gap-3 text-center">
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F8FA]">
					<GradientAutomationsIcon />
				</div>
				<div className="space-y-1">
					<h3 className="text-xl font-semibold text-foreground">
						{__('Import Completed!', 'doublescale')}
					</h3>
					<p className="text-sm text-muted-foreground">
						{__(
							'Imported automations are created as inactive so you can review them first.',
							'doublescale'
						)}
					</p>
				</div>
			</div>

			<div className="space-y-2">
				<Progress value={100} className="w-full" />
				<div className="flex justify-between text-xs text-muted-foreground">
					<span>
						{sprintf(
							/* translators: %1$d: processed count, %2$d: total count */
							__('%1$d of %2$d workflows processed', 'doublescale'),
							totalToImport,
							totalToImport
						)}
					</span>
					<span>100%</span>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div className="flex flex-col items-center rounded-lg bg-green-50 p-3">
					<CheckCircle2 className="mb-1 h-6 w-6 text-green-600" />
					<span className="text-lg font-semibold text-green-700">
						{importedCount}
					</span>
					<span className="text-xs text-green-600">
						{__('Imported', 'doublescale')}
					</span>
				</div>
				<div className="flex flex-col items-center rounded-lg bg-red-50 p-3">
					<XCircle className="mb-1 h-6 w-6 text-red-600" />
					<span className="text-lg font-semibold text-red-700">
						{failures.length}
					</span>
					<span className="text-xs text-red-600">
						{__('Failed', 'doublescale')}
					</span>
				</div>
			</div>

			{failures.length > 0 && (
				<div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border p-3">
					{failures.map((failure, index) => (
						<p key={`${failure.name}-${index}`} className="text-xs text-destructive">
							<strong>{failure.name}:</strong> {failure.message}
						</p>
					))}
				</div>
			)}
		</div>
	);

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					handleClose();
				}
			}}
		>
			<DialogContent className="max-w-xl gap-0 overflow-hidden p-0 sm:rounded-2xl">
				<DialogHeader className="border-b border-border px-6 py-4">
					<div className="flex items-start justify-between gap-3">
						<CustomDialogHeader
							icon={<GradientAutomationsIcon />}
							title={__('Import Automations', 'doublescale')}
							subtitle={
								step === 'upload'
									? __('Upload a workflow export file', 'doublescale')
									: step === 'select'
										? __('Choose which workflows to import', 'doublescale')
										: step === 'progress'
											? __('Import in progress', 'doublescale')
											: __('Import summary', 'doublescale')
							}
						/>
						{step !== 'progress' && (
							<button
								type="button"
								onClick={handleClose}
								className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
								aria-label={__('Close', 'doublescale')}
							>
								<X className="h-4 w-4" />
							</button>
						)}
					</div>
				</DialogHeader>

				<div className="px-6 py-5">
					{step === 'upload' && renderUpload()}
					{step === 'select' && renderSelect()}
					{step === 'progress' && renderProgress()}
					{step === 'done' && renderDone()}
				</div>

				{(step === 'select' || step === 'done') && (
					<DialogFooter className="border-t border-border px-6 py-4">
						{step === 'select' && (
							<>
								<Button
									type="button"
									variant="outline"
									onClick={handleClose}
								>
									{__('Cancel', 'doublescale')}
								</Button>
								<Button
									type="button"
									onClick={() => void runImport()}
									disabled={selectedIds.length === 0}
								>
									{sprintf(
										/* translators: %d: number of selected workflows */
										__('Import %d workflow(s)', 'doublescale'),
										selectedIds.length
									)}
								</Button>
							</>
						)}
						{step === 'done' && (
							<Button type="button" onClick={handleClose}>
								{__('Close', 'doublescale')}
							</Button>
						)}
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default ImportWorkflowsModal;
