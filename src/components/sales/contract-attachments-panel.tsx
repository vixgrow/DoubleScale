/**
 * Contract attachments upload and list.
 */

import React, { useCallback, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useDropzone } from 'react-dropzone';
import { Download, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
}

const formatFileSize = (bytes: number): string => {
	if (!bytes || bytes <= 0) {
		return '';
	}
	const units = ['B', 'KB', 'MB', 'GB'];
	const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	const value = bytes / Math.pow(1024, exponent);
	return `${exponent === 0 ? value : Math.round(value * 10) / 10} ${units[exponent]}`;
};

const buildLimitsHint = (limits: ContractAttachmentLimits | null): string => {
	if (!limits) {
		return '';
	}

	const { max_file_count: maxFileCount, max_file_size_bytes: maxFileSizeBytes } = limits;
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

const ContractAttachmentsPanel: React.FC<Props> = ({
	contractId,
	canManage = true,
	onNotice,
}) => {
	const { data: attachments, limits, loading, refetch } = useContractAttachments(
		contractId,
		!!contractId
	);
	const [uploading, setUploading] = useState(false);
	const limitsHint = buildLimitsHint(limits);

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

			const oversized = maxBytes > 0 ? files.find((file) => file.size > maxBytes) : undefined;
			if (oversized) {
				onNotice?.(
					sprintf(
						/* translators: 1: file name, 2: max size (e.g. "10 MB") */
						__('"%1$s" exceeds the maximum upload size of %2$s.', 'doublescale'),
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
				onNotice?.(err instanceof Error ? err.message : __('Upload failed.', 'doublescale'));
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

	const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
		onDrop,
		noClick: true,
		disabled: !canManage || !contractId || uploading,
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
			onNotice?.(err instanceof Error ? err.message : __('Delete failed.', 'doublescale'));
		} finally {
			setUploading(false);
		}
	};

	if (!contractId) {
		return (
			<p className="text-sm text-muted-foreground">
				{__('Save the contract first to upload attachments.', 'doublescale')}
			</p>
		);
	}

	return (
		<div className="space-y-4">
			{canManage ? (
				<div
					{...getRootProps()}
					className={`rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
						isDragActive
							? 'border-primary bg-primary/5'
							: 'border-muted-foreground/30 bg-muted/20'
					}`}
				>
					<input {...getInputProps()} />
					<Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
					<p className="text-sm font-medium">
						{isDragActive
							? __('Drop files here…', 'doublescale')
							: __('Drop files here to upload', 'doublescale')}
					</p>
					<p className="text-xs text-muted-foreground mt-2">
						{__('or', 'doublescale')}
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="mt-3"
						disabled={uploading}
						onClick={open}
					>
						{uploading ? __('Uploading…', 'doublescale') : __('Choose files', 'doublescale')}
					</Button>
					{limitsHint ? (
						<p className="text-xs text-muted-foreground mt-3">{limitsHint}</p>
					) : null}
				</div>
			) : null}

			{loading ? (
				<p className="text-sm text-muted-foreground">{__('Loading attachments…', 'doublescale')}</p>
			) : attachments.length > 0 ? (
				<ul className="divide-y rounded-lg border bg-white">
					{attachments.map((file) => (
						<li
							key={file.file_hash}
							className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
						>
							<div className="min-w-0">
								<div className="font-medium truncate">{file.file_name}</div>
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
							<div className="flex items-center gap-1 shrink-0">
								<Button type="button" variant="ghost" size="icon" asChild>
									<a href={file.url} target="_blank" rel="noopener noreferrer" download>
										<Download className="h-4 w-4" />
									</a>
								</Button>
								{canManage ? (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="text-muted-foreground hover:text-red-600"
										disabled={uploading}
										onClick={() => void handleDelete(file.file_hash)}
										aria-label={__('Delete attachment', 'doublescale')}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								) : null}
							</div>
						</li>
					))}
				</ul>
			) : (
				<p className="text-sm text-muted-foreground">{__('No attachments yet.', 'doublescale')}</p>
			)}
		</div>
	);
};

export default ContractAttachmentsPanel;
