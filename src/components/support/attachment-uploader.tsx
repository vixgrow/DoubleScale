/**
 * Pending attachment chips + file picker for support composers.
 */

import React, { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Paperclip, X } from 'lucide-react';

import type { AttachmentUploadResult } from '@/types/support';

export interface PendingAttachment {
	file_hash: string;
	file_name: string;
}

interface Props {
	pending: PendingAttachment[];
	uploading: boolean;
	onSelect: (file: File) => void;
	onRemove: (fileHash: string) => void;
	disabled?: boolean;
}

const AttachmentUploader: React.FC<Props> = ({
	pending,
	uploading,
	onSelect,
	onRemove,
	disabled = false,
}) => {
	const inputRef = useRef<HTMLInputElement>(null);

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
					{pending.map((item) => (
						<li
							key={item.file_hash}
							className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
						>
							<span className="max-w-[12rem] truncate">
								{item.file_name}
							</span>
							<button
								type="button"
								className="text-gray-500 hover:text-gray-800"
								onClick={() => onRemove(item.file_hash)}
								aria-label={__('Remove attachment', 'doublescale')}
							>
								<X width={12} height={12} />
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default AttachmentUploader;

export const toPendingAttachment = (
	result: AttachmentUploadResult
): PendingAttachment => ({
	file_hash: result.file_hash,
	file_name: result.file_name,
});
