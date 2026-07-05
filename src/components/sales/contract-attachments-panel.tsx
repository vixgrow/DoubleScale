/**
 * Contract attachments upload and list.
 */

import React, { useCallback, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useDropzone } from 'react-dropzone';

import { DeleteIcon, FormField, DownloadIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ContractAttachmentLimits } from '@/types/sales';
import {
	deleteContractAttachment,
	uploadContractAttachment,
	useContractAttachments,
} from '@/hooks/sales';

interface Props {
	contractId: number | null;
	canManage?: boolean;
	onNotice?: (message: string) => void;
	layout?: 'default' | 'form';
	/** When false, hides the logo upload zone in form layout (e.g. contract view). */
	showLogoUpload?: boolean;
	file_classname?: string;
}

const formatFileSize = (bytes: number): string => {
	if (!bytes || bytes <= 0) {
		return '';
	}
	const units = ['B', 'KB', 'MB', 'GB'];
	const exponent = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1
	);
	const value = bytes / Math.pow(1024, exponent);
	return `${exponent === 0 ? value : Math.round(value * 10) / 10} ${units[exponent]}`;
};

const buildLimitsHint = (limits: ContractAttachmentLimits | null): string => {
	if (!limits) {
		return '';
	}

	const {
		max_file_count: maxFileCount,
		max_file_size_bytes: maxFileSizeBytes,
	} = limits;
	const hasCount = maxFileCount > 0;
	const hasSize = maxFileSizeBytes > 0;

	if (hasCount && hasSize) {
		return sprintf(
			/* translators: 1: max number of files, 2: max size per file (e.g. "10 MB") */
			_n(
				'Up to %1$d file, %2$s each',
				'Up to %1$d files, %2$s each',
				maxFileCount,
				'doublescale'
			),
			maxFileCount,
			formatFileSize(maxFileSizeBytes)
		);
	}
	if (hasSize) {
		return sprintf(
			/* translators: %s: max size per file (e.g. "10 MB") */
			__('Max %s per file', 'doublescale'),
			formatFileSize(maxFileSizeBytes)
		);
	}
	if (hasCount) {
		return sprintf(
			/* translators: %d: max number of files */
			_n('Up to %d file', 'Up to %d files', maxFileCount, 'doublescale'),
			maxFileCount
		);
	}

	return '';
};

const UploadDropzone: React.FC<{
	disabled: boolean;
	uploading: boolean;
	limitsHint: string;
	isDragActive: boolean;
	getRootProps: ReturnType<typeof useDropzone>['getRootProps'];
	getInputProps: ReturnType<typeof useDropzone>['getInputProps'];
	variant?: 'default' | 'form';
}> = ({
	disabled,
	uploading,
	limitsHint,
	isDragActive,
	getRootProps,
	getInputProps,
	variant = 'default',
}) => {
	const isForm = variant === 'form';
	const borderStroke = isDragActive
		? 'hsl(var(--primary))'
		: isForm
			? '#D0D0D0'
			: 'hsl(var(--muted-foreground) / 0.35)';

	return (
		<div
			{...getRootProps()}
			className={cn(
				'relative rounded-lg p-10 text-center transition-colors',
				!disabled && !uploading && 'cursor-pointer',
				isForm
					? isDragActive
						? 'bg-primary/5'
						: 'bg-white'
					: isDragActive
						? 'bg-primary/5'
						: 'bg-muted/20'
			)}
		>
			<svg
				className="pointer-events-none absolute inset-0 z-0 h-full w-full rounded-lg"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<rect
					x="0.5"
					y="0.5"
					width="calc(100% - 1px)"
					height="calc(100% - 1px)"
					rx="7"
					ry="7"
					fill="none"
					stroke={borderStroke}
					strokeWidth="1"
					strokeDasharray="20 14"
					vectorEffect="nonScalingStroke"
				/>
			</svg>
			<div className="relative z-10">
				<input {...getInputProps()} />
				<div className="flex items-center justify-center">
					<svg
						width="48"
						height="48"
						viewBox="0 0 48 48"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							opacity="0.4"
							d="M37.0098 20.7373C40.8498 20.7373 44.0098 23.8773 44.0098 27.7373C44.0098 29.8773 43.3698 33.2573 42.5698 35.2373L41.3298 38.3373C40.3498 40.7573 37.4298 42.7373 34.8298 42.7373H13.1897C10.5897 42.7373 7.66971 40.7573 6.68971 38.3373L5.44971 35.2373C4.64971 33.2573 4.00977 29.8773 4.00977 27.7373C4.00977 25.8173 4.80983 24.0573 6.06983 22.7973C7.32983 21.5173 9.08977 20.7373 11.0098 20.7373H37.0098Z"
							fill="#3A3A99"
						/>
						<path
							d="M23.7288 5.2777C23.9088 5.2577 24.1088 5.2577 24.2888 5.2777C24.5888 5.3377 24.8688 5.4577 25.0688 5.6777L31.4286 12.0377C32.0086 12.6177 32.0086 13.5777 31.4286 14.1577C30.8486 14.7377 29.8888 14.7377 29.3088 14.1577L25.5088 10.3577V29.0977C25.5088 29.9177 24.8288 30.5977 24.0088 30.5977C23.1888 30.5977 22.5088 29.9177 22.5088 29.0977V10.3577L18.7287 14.1577C18.4287 14.4577 18.0486 14.5977 17.6686 14.5977C17.2886 14.5977 16.8888 14.4577 16.6088 14.1577C16.0288 13.5777 16.0288 12.6177 16.6088 12.0377L22.9486 5.6777C23.0286 5.5977 23.1288 5.5177 23.2288 5.4777C23.2888 5.4377 23.3286 5.3977 23.3886 5.3977C23.4886 5.3377 23.6088 5.2977 23.7288 5.2777Z"
							fill="#3A3A99"
						/>
					</svg>
				</div>
				{isForm ? (
					<p className="text-sm text-foreground">
						<span className="font-medium text-primary">
							{__('Choose files', 'doublescale')}
						</span>
						<span className="text-muted-foreground">
							{' '}
							{__('to Drop files here to upload', 'doublescale')}
						</span>
					</p>
				) : (
					<>
						<p className="text-sm font-medium">
							{isDragActive
								? __('Drop files here…', 'doublescale')
								: __(
										'Drop files here to upload',
										'doublescale'
									)}
						</p>
						<p className="mt-2 text-xs text-muted-foreground">
							{__('or click to browse', 'doublescale')}
						</p>
					</>
				)}
				{limitsHint ? (
					<p className="mt-3 text-xs text-muted-foreground">
						{limitsHint}
					</p>
				) : null}
			</div>
		</div>
	);
};

const ContractAttachmentsPanel: React.FC<Props> = ({
	contractId,
	canManage = true,
	onNotice,
	layout = 'default',
	showLogoUpload = true,
	file_classname = 'bg-[#F7F8FA]',
}) => {
	const {
		data: attachments,
		limits,
		loading,
		refetch,
	} = useContractAttachments(contractId, !!contractId);
	const [uploading, setUploading] = useState(false);
	const limitsHint = buildLimitsHint(limits);
	const isFormLayout = layout === 'form';

	const uploadFiles = useCallback(
		async (files: File[]) => {
			if (!contractId || files.length === 0) {
				return;
			}

			const maxBytes = limits?.max_file_size_bytes ?? 0;
			const maxCount = limits?.max_file_count ?? 0;
			if (maxCount > 0 && attachments.length + files.length > maxCount) {
				onNotice?.(
					sprintf(
						/* translators: %d: maximum number of files */
						_n(
							'You can attach at most %d file to this contract.',
							'You can attach at most %d files to this contract.',
							maxCount,
							'doublescale'
						),
						maxCount
					)
				);
				return;
			}

			const oversized =
				maxBytes > 0
					? files.find((file) => file.size > maxBytes)
					: undefined;
			if (oversized) {
				onNotice?.(
					sprintf(
						/* translators: 1: file name, 2: max size (e.g. "10 MB") */
						__(
							'"%1$s" exceeds the maximum upload size of %2$s.',
							'doublescale'
						),
						oversized.name,
						formatFileSize(maxBytes)
					)
				);
				return;
			}

			setUploading(true);
			try {
				for (const file of files) {
					await uploadContractAttachment(contractId, file);
				}
				await refetch();
				onNotice?.(__('File uploaded.', 'doublescale'));
			} catch (err: unknown) {
				onNotice?.(
					err instanceof Error
						? err.message
						: __('Upload failed.', 'doublescale')
				);
			} finally {
				setUploading(false);
			}
		},
		[attachments.length, contractId, limits, onNotice, refetch]
	);

	const onDrop = useCallback(
		(accepted: File[]) => {
			void uploadFiles(accepted);
		},
		[uploadFiles]
	);

	const dropzoneDisabled = !canManage || !contractId || uploading;

	const logoDropzone = useDropzone({
		onDrop,
		disabled: dropzoneDisabled,
		multiple: true,
	});

	const attachmentsDropzone = useDropzone({
		onDrop,
		disabled: dropzoneDisabled,
		multiple: true,
	});

	const handleDelete = async (fileHash: string) => {
		if (!contractId) {
			return;
		}
		setUploading(true);
		try {
			await deleteContractAttachment(contractId, fileHash);
			await refetch();
		} catch (err: unknown) {
			onNotice?.(
				err instanceof Error
					? err.message
					: __('Delete failed.', 'doublescale')
			);
		} finally {
			setUploading(false);
		}
	};

	if (!contractId) {
		return (
			<p className="text-sm text-muted-foreground">
				{__(
					'Save the contract first to upload attachments.',
					'doublescale'
				)}
			</p>
		);
	}

	const attachmentList = loading ? (
		<p className="text-sm text-muted-foreground">
			{__('Loading attachments…', 'doublescale')}
		</p>
	) : attachments.length > 0 ? (
		isFormLayout ? (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{attachments.map((file) => (
					<div
						key={file.file_hash}
						className={cn(
							'flex min-w-0 items-center justify-between gap-3 rounded-lg border border-[#DEE1E6] p-4',
							file_classname
						)}
					>
						<span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
							{file.file_name}
						</span>
						<div className="flex shrink-0 items-center gap-1">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								asChild
							>
								<a
									href={file.url}
									target="_blank"
									rel="noopener noreferrer"
									download
								>
									<DownloadIcon />
								</a>
							</Button>
							{canManage ? (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="text-destructive hover:text-destructive"
									disabled={uploading}
									onClick={() =>
										void handleDelete(file.file_hash)
									}
									aria-label={__(
										'Delete attachment',
										'doublescale'
									)}
								>
									<DeleteIcon />
								</Button>
							) : null}
						</div>
					</div>
				))}
			</div>
		) : (
			<ul className="divide-y rounded-lg border bg-white">
				{attachments.map((file) => (
					<li
						key={file.file_hash}
						className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
					>
						<div className="min-w-0">
							<div className="truncate font-medium">
								{file.file_name}
							</div>
							<div className="text-xs text-muted-foreground">
								{formatFileSize(file.file_size)}
								{file.uploaded_by
									? ` · ${sprintf(
											/* translators: %s: uploader display name */
											__('Uploaded by %s', 'doublescale'),
											file.uploaded_by
										)}`
									: ''}
							</div>
						</div>
						<div className="flex shrink-0 items-center gap-1">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								asChild
							>
								<a
									href={file.url}
									target="_blank"
									rel="noopener noreferrer"
									download
								>
									<DownloadIcon />
								</a>
							</Button>
							{canManage ? (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="text-muted-foreground hover:text-red-600"
									disabled={uploading}
									onClick={() =>
										void handleDelete(file.file_hash)
									}
									aria-label={__(
										'Delete attachment',
										'doublescale'
									)}
								>
									<DeleteIcon />
								</Button>
							) : null}
						</div>
					</li>
				))}
			</ul>
		)
	) : (
		<p className="text-sm text-muted-foreground">
			{__('No attachments yet.', 'doublescale')}
		</p>
	);

	if (isFormLayout) {
		return (
			<div className="space-y-6">
				{canManage && showLogoUpload ? (
					<FormField
						label={__('Logo', 'doublescale')}
						className="!mb-0"
					>
						<UploadDropzone
							variant="form"
							disabled={dropzoneDisabled}
							uploading={uploading}
							limitsHint={limitsHint}
							isDragActive={logoDropzone.isDragActive}
							getRootProps={logoDropzone.getRootProps}
							getInputProps={logoDropzone.getInputProps}
						/>
					</FormField>
				) : null}

				<FormField
					label={__('Attachments', 'doublescale')}
					className={cn(
						'!mb-0',
						canManage && showLogoUpload && 'border-t border-[#DEE1E6] pt-4'
					)}
				>
					{attachmentList}
				</FormField>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{canManage ? (
				<UploadDropzone
					disabled={dropzoneDisabled}
					uploading={uploading}
					limitsHint={limitsHint}
					isDragActive={attachmentsDropzone.isDragActive}
					getRootProps={attachmentsDropzone.getRootProps}
					getInputProps={attachmentsDropzone.getInputProps}
				/>
			) : null}
			{attachmentList}
		</div>
	);
};

export default ContractAttachmentsPanel;
