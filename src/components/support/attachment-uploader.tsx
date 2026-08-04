/**
 * Pending attachment chips + file picker for support composers.
 *
 * Selected images show a small thumbnail (from a local `URL.createObjectURL`
 * preview) so the user sees what they picked before the message is sent; other
 * file types show a paperclip + filename chip. Object URLs are revoked on
 * removal and on unmount to avoid leaking blob memory.
 */

import React, { useEffect, useRef } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Paperclip, X } from 'lucide-react';

import type { AttachmentUploadResult } from '@/types/support';
import { AttachmentsIcon } from '@doublescale/components';

export interface PendingAttachment {
	file_hash: string;
	file_name: string;
	/** MIME type from the upload result; drives the image-thumbnail branch. */
	file_type?: string;
	/** Local object URL for an image preview; absent for non-images. */
	previewUrl?: string;
}

interface Props {
	pending: PendingAttachment[];
	uploading: boolean;
	onSelect: (file: File) => void;
	onRemove: (fileHash: string) => void;
	disabled?: boolean;
	/** Max files allowed in this composer; the button disables at the limit. */
	maxFileCount?: number;
	/** Max size per file in bytes; oversized files are rejected before upload. */
	maxFileSizeBytes?: number;
	/**
	 * Surface a client-side validation message (too many files / too large) to
	 * the parent so it can render it through its existing feedback/notice UI.
	 */
	onValidationError?: (message: string) => void;
}

const isImage = (item: PendingAttachment): boolean =>
	!!item.previewUrl &&
	typeof item.file_type === 'string' &&
	item.file_type.toLowerCase().startsWith('image/');

/** Human-readable size for helper text / messages (e.g. "5 MB"). */
const formatBytes = (bytes: number): string => {
	if (!bytes || bytes <= 0) {
		return '';
	}
	const units = ['B', 'KB', 'MB', 'GB'];
	const exponent = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1
	);
	const value = bytes / Math.pow(1024, exponent);
	const rounded = exponent === 0 ? value : Math.round(value * 10) / 10;
	return `${rounded} ${units[exponent]}`;
};

/** Build the muted "Up to N files, X each" hint shown next to the button. */
const buildLimitsHint = (
	maxFileCount?: number,
	maxFileSizeBytes?: number
): string => {
	const hasCount = typeof maxFileCount === 'number' && maxFileCount > 0;
	const hasSize =
		typeof maxFileSizeBytes === 'number' && maxFileSizeBytes > 0;

	if (hasCount && hasSize) {
		return sprintf(
			/* translators: 1: max number of files, 2: max size per file (e.g. "5 MB") */
			_n(
				'Up to %1$d file, %2$s each',
				'Up to %1$d files, %2$s each',
				maxFileCount as number,
				'doublescale'
			),
			maxFileCount as number,
			formatBytes(maxFileSizeBytes as number)
		);
	}
	if (hasSize) {
		return sprintf(
			/* translators: %s: max size per file (e.g. "5 MB") */
			__('Max %s per file', 'doublescale'),
			formatBytes(maxFileSizeBytes as number)
		);
	}
	if (hasCount) {
		return sprintf(
			/* translators: %d: max number of files */
			_n(
				'Up to %d file',
				'Up to %d files',
				maxFileCount as number,
				'doublescale'
			),
			maxFileCount as number
		);
	}
	return '';
};

const AttachmentUploader: React.FC<Props> = ({
	pending,
	uploading,
	onSelect,
	onRemove,
	disabled = false,
	maxFileCount,
	maxFileSizeBytes,
	onValidationError,
}) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const hasCountLimit = typeof maxFileCount === 'number' && maxFileCount > 0;
	const atLimit = hasCountLimit && pending.length >= (maxFileCount as number);

	const handleSelect = (file: File) => {
		// Count guard: block once the composer is full.
		if (hasCountLimit && pending.length >= (maxFileCount as number)) {
			onValidationError?.(
				sprintf(
					/* translators: %d: maximum number of files */
					_n(
						'You can attach at most %d file.',
						'You can attach at most %d files.',
						maxFileCount as number,
						'doublescale'
					),
					maxFileCount as number
				)
			);
			return;
		}
		// Size guard: reject before the (potentially large) upload round-trip.
		if (
			typeof maxFileSizeBytes === 'number' &&
			maxFileSizeBytes > 0 &&
			file.size > maxFileSizeBytes
		) {
			onValidationError?.(
				sprintf(
					/* translators: 1: file name, 2: maximum file size (e.g. "5 MB") */
					__(
						'%1$s exceeds the maximum file size of %2$s.',
						'doublescale'
					),
					file.name,
					formatBytes(maxFileSizeBytes)
				)
			);
			return;
		}
		onSelect(file);
	};

	// Revoke any outstanding object URLs when the uploader unmounts so picked
	// image previews don't leak. (Per-item revoke happens in the parent's
	// onRemove path; this is the safety net for unmount / navigation away.)
	const pendingRef = useRef(pending);
	pendingRef.current = pending;
	useEffect(() => {
		return () => {
			pendingRef.current.forEach((item) => {
				if (item.previewUrl) {
					URL.revokeObjectURL(item.previewUrl);
				}
			});
		};
	}, []);

	const limitsHint = buildLimitsHint(maxFileCount, maxFileSizeBytes);

	return (
		<div className="mt-2">
			<input
				ref={inputRef}
				type="file"
				className="hidden"
				disabled={disabled || uploading}
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) {
						handleSelect(file);
					}
					e.target.value = '';
				}}
			/>
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
				<button
					type="button"
					className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={disabled || uploading || atLimit}
					title={
						atLimit
							? __(
									'Attachment limit reached.',
									'doublescale'
								)
							: undefined
					}
					onClick={() => inputRef.current?.click()}
				>
					<AttachmentsIcon width={20} height={20} />
					{uploading
						? __('Uploading…', 'doublescale')
						: __('Attach file', 'doublescale')}
				</button>
				{limitsHint && (
					<span className="text-xs text-gray-400">
						{limitsHint}
					</span>
				)}
			</div>
			{pending.length > 0 && (
				<ul className="mt-2 flex flex-wrap gap-2">
					{pending.map((item) =>
						isImage(item) ? (
							<li
								key={item.file_hash}
								className="group relative h-16 w-16 overflow-hidden rounded border border-gray-200"
							>
								<img
									src={item.previewUrl}
									alt={item.file_name}
									title={item.file_name}
									className="h-full w-full object-cover"
								/>
								<button
									type="button"
									className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
									onClick={() => onRemove(item.file_hash)}
									aria-label={__(
										'Remove attachment',
										'doublescale'
									)}
								>
									<X width={12} height={12} />
								</button>
							</li>
						) : (
							<li
								key={item.file_hash}
								className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
							>
								<Paperclip
									width={12}
									height={12}
									className="shrink-0 opacity-60"
								/>
								<span className="max-w-[12rem] truncate">
									{item.file_name}
								</span>
								<button
									type="button"
									className="text-gray-500 hover:text-gray-800"
									onClick={() => onRemove(item.file_hash)}
									aria-label={__(
										'Remove attachment',
										'doublescale'
									)}
								>
									<X width={12} height={12} />
								</button>
							</li>
						)
					)}
				</ul>
			)}
		</div>
	);
};

export default AttachmentUploader;

/**
 * Revoke the object URLs held by a list of pending attachments. Call before
 * clearing pending state in bulk (e.g. after a successful send) so image
 * previews don't leak blob memory.
 */
export const revokePendingPreviews = (items: PendingAttachment[]): void => {
	items.forEach((item) => {
		if (item.previewUrl) {
			URL.revokeObjectURL(item.previewUrl);
		}
	});
};

/**
 * Remove one pending attachment by hash, revoking its preview URL. Returns the
 * filtered list; use inside a `setPendingAttachments` updater.
 */
export const removePendingByHash = (
	items: PendingAttachment[],
	fileHash: string
): PendingAttachment[] =>
	items.filter((item) => {
		if (item.file_hash === fileHash && item.previewUrl) {
			URL.revokeObjectURL(item.previewUrl);
		}
		return item.file_hash !== fileHash;
	});

/**
 * Build a {@see PendingAttachment} from an upload response, optionally capturing
 * a local image preview from the original `File`. Pass `file` to enable the
 * thumbnail; the caller owns revoking `previewUrl` (the uploader revokes on
 * unmount as a backstop).
 */
export const toPendingAttachment = (
	result: AttachmentUploadResult,
	file?: File
): PendingAttachment => {
	const fileType = result.file_type || file?.type || '';
	const isImg = fileType.toLowerCase().startsWith('image/');
	return {
		file_hash: result.file_hash,
		file_name: result.file_name,
		file_type: fileType,
		previewUrl: isImg && file ? URL.createObjectURL(file) : undefined,
	};
};
