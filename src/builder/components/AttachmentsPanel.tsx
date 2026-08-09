/**
 * Email builder attachments panel — pick files from the WordPress Media Library.
 */
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch, select } from '@wordpress/data';
import { Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STORE_KEY } from '../../stores/email-builder/constants';
import type { EmailAttachment } from '../../stores/email-builder/types';

export const MAX_EMAIL_ATTACHMENTS = 5;
export const MAX_EMAIL_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
	'.pdf',
	'.doc',
	'.docx',
	'.xls',
	'.xlsx',
	'.txt',
	'.zip',
	'.rtf',
]);

const ALLOWED_MIME_PREFIXES = [
	'application/pdf',
	'application/msword',
	'application/vnd.',
	'text/plain',
	'application/zip',
	'application/x-zip-compressed',
	'application/rtf',
];

const formatFileSize = (bytes: number): string => {
	if (bytes <= 0) {
		return '';
	}
	if (bytes < 1024) {
		return `${bytes} B`;
	}
	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`;
	}
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFilename = (data: Record<string, unknown>): string => {
	const filename = data.filename;
	if (typeof filename === 'string' && filename.trim()) {
		return filename;
	}
	const title = data.title;
	if (typeof title === 'string' && title.trim()) {
		return title;
	}
	const url = data.url;
	if (typeof url === 'string' && url) {
		try {
			const path = new URL(url, window.location.origin).pathname;
			const base = path.split('/').pop();
			if (base) {
				return decodeURIComponent(base);
			}
		} catch {
			// Fall through.
		}
	}
	return __('Attachment', 'doublescale');
};

const getExtension = (filename: string): string => {
	const dot = filename.lastIndexOf('.');
	return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
};

const isAllowedAttachment = (
	mime: string,
	size: number,
	filename: string
): boolean => {
	if (size > MAX_EMAIL_ATTACHMENT_BYTES) {
		return false;
	}

	const ext = getExtension(filename);
	if (ext && ALLOWED_EXTENSIONS.has(ext)) {
		return true;
	}

	if (!mime) {
		return false;
	}

	return ALLOWED_MIME_PREFIXES.some(
		(prefix) => mime === prefix || mime.startsWith(prefix)
	);
};

const AttachmentsPanel: React.FC = () => {
	const dispatch = useDispatch();
	const { createNotice } = useDispatch('doublescale/core');
	const attachments = useSelect(
		(s) => s(STORE_KEY).getAttachments?.() ?? [],
		[]
	);

	const openMediaLibrary = () => {
		if (attachments.length >= MAX_EMAIL_ATTACHMENTS) {
			return;
		}

		const storeSelect = select(STORE_KEY) as {
			getAttachments?: () => EmailAttachment[];
		};
		if (typeof storeSelect.getAttachments !== 'function') {
			createNotice({
				type: 'error',
				message: __(
					'Attachments could not load. Hard-refresh the page and try again.',
					'doublescale'
				),
			});
			return;
		}

		if (typeof window.wp === 'undefined' || !window.wp.media) {
			createNotice({
				type: 'error',
				message: __(
					'Media Library is unavailable. Reload the page and try again.',
					'doublescale'
				),
			});
			return;
		}

		const remaining = MAX_EMAIL_ATTACHMENTS - attachments.length;

		const frame = window.wp.media({
			title: __('Attach files', 'doublescale'),
			button: {
				text: __('Attach', 'doublescale'),
			},
			multiple: remaining > 1 ? 'add' : false,
		});

		frame.on('select', () => {
			const current = storeSelect.getAttachments?.() ?? [];
			const selection = frame.state().get('selection');
			const added: EmailAttachment[] = [];
			let rejected = 0;

			selection.each((attachment: { toJSON: () => Record<string, unknown> }) => {
				if (current.length + added.length >= MAX_EMAIL_ATTACHMENTS) {
					return;
				}

				const data = attachment.toJSON();
				const filename = getFilename(data);
				const mime = String(data.mime || data.mime_type || '');
				const size = Number(
					data.filesizeInBytes || data.filesize || 0
				);

				if (!isAllowedAttachment(mime, size, filename)) {
					rejected += 1;
					return;
				}

				const id = Number(data.id);
				if (
					!id ||
					current.some((item) => item.id === id) ||
					added.some((item) => item.id === id)
				) {
					return;
				}

				added.push({
					id,
					filename,
					mime: mime || 'application/octet-stream',
					size,
				});
			});

			if (added.length === 0) {
				createNotice({
					type: 'error',
					message:
						rejected > 0
							? __(
									'File not added. Use PDF, Word, Excel, TXT, or ZIP under 10 MB.',
									'doublescale'
							  )
							: __(
									'No file was selected.',
									'doublescale'
							  ),
				});
				return;
			}

			if (typeof dispatch(STORE_KEY).setAttachments !== 'function') {
				createNotice({
					type: 'error',
					message: __(
						'Could not save attachment. Hard-refresh the page and try again.',
						'doublescale'
					),
				});
				return;
			}

			dispatch(STORE_KEY).setAttachments([...current, ...added]);
			createNotice({
				type: 'success',
				message: sprintf(
					/* translators: %d: number of files attached */
					_n(
						'%d file attached.',
						'%d files attached.',
						added.length,
						'doublescale'
					),
					added.length
				),
			});
		});

		frame.on('open', () => {
			setTimeout(() => {
				const mediaModal = document.querySelector('.media-modal');
				const mediaModalBackdrop = document.querySelector(
					'.media-modal-backdrop'
				);
				if (mediaModal) {
					(mediaModal as HTMLElement).style.zIndex = '999999';
				}
				if (mediaModalBackdrop) {
					(mediaModalBackdrop as HTMLElement).style.zIndex = '999998';
				}
			}, 10);
		});

		frame.open();
	};

	const removeAttachment = (id: number) => {
		dispatch(STORE_KEY).setAttachments(
			attachments.filter((item) => item.id !== id)
		);
	};

	return (
		<div className="grid gap-4">
			<div className="flex flex-col gap-2">
				<div className="text-sm font-medium text-white">
					{__('Attachments', 'doublescale')}
				</div>
				<p className="text-xs text-white/70">
					{sprintf(
						/* translators: %1$d: max files, %2$s: max size per file */
						__(
							'Attach up to %1$d files (max %2$s each). Files are sent with the email.',
							'doublescale'
						),
						MAX_EMAIL_ATTACHMENTS,
						'10 MB'
					)}
				</p>
			</div>

			{attachments.length > 0 && (
				<ul className="grid gap-2">
					{attachments.map((file) => (
						<li
							key={file.id}
							className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-3 py-2"
						>
							<Paperclip className="h-4 w-4 shrink-0 text-white/70" />
							<div className="min-w-0 flex-1">
								<div
									className="truncate text-sm text-white"
									title={file.filename}
								>
									{file.filename}
								</div>
								{file.size > 0 && (
									<div className="text-xs text-white/60">
										{formatFileSize(file.size)}
									</div>
								)}
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 w-8 shrink-0 p-0 text-white hover:bg-white/10 hover:text-white"
								onClick={() => removeAttachment(file.id)}
								aria-label={__(
									'Remove attachment',
									'doublescale'
								)}
							>
								<X className="h-4 w-4" />
							</Button>
						</li>
					))}
				</ul>
			)}

			<Button
				type="button"
				variant="outline"
				className="border-white/20 bg-white/[0.05] text-white hover:bg-white/10 hover:text-white"
				onClick={openMediaLibrary}
				disabled={attachments.length >= MAX_EMAIL_ATTACHMENTS}
			>
				<Paperclip className="mr-2 h-4 w-4" />
				{__('Add attachment', 'doublescale')}
			</Button>
		</div>
	);
};

export default AttachmentsPanel;
