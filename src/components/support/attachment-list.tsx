/**
 * Renders the attachments on a single conversation message.
 *
 * Images (`image/*`) show an inline thumbnail that opens the full-size file in a
 * new tab; every other file type shows a file-type icon + name + size as a
 * download link. The server serves images with `Content-Disposition: inline`
 * (see {@see AttachmentService::serve()}), so the thumbnail `<img src>` renders
 * in-place rather than triggering a download.
 *
 * Import-clean: this pulls only `lucide-react` + local types, never the admin
 * `@doublescale/components` tree, so the public portal / guest renderer bundles
 * can reuse it.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FileText, FileArchive, File as FileIcon } from 'lucide-react';

import type { ConversationAttachment } from '@/types/support';

/** Human-readable file size (e.g. 1.2 MB). */
function formatFileSize(bytes: number): string {
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
}

const isImage = (fileType: string): boolean =>
	typeof fileType === 'string' && fileType.toLowerCase().startsWith('image/');

/** Pick a file-type icon for non-image attachments. */
const FileTypeIcon: React.FC<{ fileType: string; className?: string }> = ({
	fileType,
	className,
}) => {
	const type = (fileType || '').toLowerCase();
	if (type.includes('zip') || type.includes('compressed')) {
		return <FileArchive className={className} />;
	}
	if (
		type === 'application/pdf' ||
		type.startsWith('text/') ||
		type.includes('word') ||
		type.includes('excel') ||
		type.includes('spreadsheet') ||
		type.includes('document')
	) {
		return <FileText className={className} />;
	}
	return <FileIcon className={className} />;
};

interface AttachmentListProps {
	attachments?: ConversationAttachment[];
	/**
	 * Accent class for links/hover (the portal uses `text-primary`, the admin and
	 * guest views use `text-blue-600`). Defaults to the admin/guest blue.
	 */
	accentClassName?: string;
}

const AttachmentList: React.FC<AttachmentListProps> = ({
	attachments,
	accentClassName = 'text-blue-600',
}) => {
	if (!attachments?.length) {
		return null;
	}

	// Inline email images are already embedded in the message body (their `cid:`
	// was rewritten to a signed URL). Excluding them here prevents the same image
	// from appearing twice — once in the body and again as a thumbnail card.
	const visible = attachments.filter((att) => !att.is_inline);
	if (!visible.length) {
		return null;
	}

	const images = visible.filter((att) => isImage(att.file_type));
	const files = visible.filter((att) => !isImage(att.file_type));

	return (
		<div className="mt-2 space-y-2">
			{images.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{images.map((att) => (
						<a
							key={att.url}
							href={att.url}
							target="_blank"
							rel="noopener noreferrer"
							title={att.file_name}
							className="group block overflow-hidden rounded-md border border-gray-200 hover:border-gray-300"
						>
							<img
								src={att.url}
								alt={att.file_name}
								loading="lazy"
								className="h-24 w-24 object-cover transition-transform group-hover:scale-105"
							/>
						</a>
					))}
				</div>
			)}

			{files.length > 0 && (
				<ul className="space-y-1">
					{files.map((att) => {
						const size = formatFileSize(att.file_size);
						return (
							<li key={att.url}>
								<a
									href={att.url}
									target="_blank"
									rel="noopener noreferrer"
									download={att.file_name}
									className={`inline-flex max-w-full items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm hover:bg-gray-50 ${accentClassName}`}
								>
									<FileTypeIcon
										fileType={att.file_type}
										className="h-4 w-4 shrink-0 opacity-70"
									/>
									<span className="truncate font-medium">
										{att.file_name}
									</span>
									{size && (
										<span className="shrink-0 text-xs text-gray-400">
											{size}
										</span>
									)}
								</a>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
};

export default AttachmentList;

export { formatFileSize };
