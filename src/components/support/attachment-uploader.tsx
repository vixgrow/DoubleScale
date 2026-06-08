/**
 * Pending attachment chips + file picker for support composers.
 *
 * Selected images show a small thumbnail (from a local `URL.createObjectURL`
 * preview) so the user sees what they picked before the message is sent; other
 * file types show a paperclip + filename chip. Object URLs are revoked on
 * removal and on unmount to avoid leaking blob memory.
 */

import React, { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Paperclip, X } from 'lucide-react';

import type { AttachmentUploadResult } from '@/types/support';

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
}

const isImage = (item: PendingAttachment): boolean =>
	!!item.previewUrl &&
	typeof item.file_type === 'string' &&
	item.file_type.toLowerCase().startsWith('image/');

const AttachmentUploader: React.FC<Props> = ({
	pending,
	uploading,
	onSelect,
	onRemove,
	disabled = false,
}) => {
	const inputRef = useRef<HTMLInputElement>(null);

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
						onSelect(file);
					}
					e.target.value = '';
				}}
			/>
			<button
				type="button"
				className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
				disabled={disabled || uploading}
				onClick={() => inputRef.current?.click()}
			>
				<Paperclip width={14} height={14} />
				{uploading
					? __('Uploading…', 'doublescale')
					: __('Attach file', 'doublescale')}
			</button>
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
