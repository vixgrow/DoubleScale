/**
 * Email builder attachments panel — pick files from the WordPress Media Library.
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch, select } from '@wordpress/data';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STORE_KEY } from '../../stores/email-builder/constants';
import type { EmailAttachment } from '../../stores/email-builder/types';
import { AttachmentsIcon } from '@doublescale/components';

export const MAX_EMAIL_ATTACHMENTS = 5;
export const MAX_EMAIL_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/**
 * Human-readable list of accepted file types, shown to the user in the panel
 * hint and in rejection notices so they know exactly what is allowed.
 */
const ALLOWED_TYPES_LABEL = 'PDF, Word, Excel, TXT, ZIP, RTF';

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
	const trim = (value: number): string =>
		value.toFixed(1).replace(/\.0$/, '');
	if (bytes < 1024 * 1024) {
		return `${trim(bytes / 1024)} KB`;
	}
	return `${trim(bytes / (1024 * 1024))} MB`;
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

type RejectionReason = 'size' | 'type';

/**
 * Determine why a file cannot be attached, or null when it is allowed.
 *
 * Type is checked before size so the user always learns the most fundamental
 * problem first (an unsupported file is never worth resizing).
 */
const getRejectionReason = (
	mime: string,
	size: number,
	filename: string
): RejectionReason | null => {
	const ext = getExtension(filename);
	const hasAllowedExt = Boolean(ext) && ALLOWED_EXTENSIONS.has(ext);
	const hasAllowedMime =
		Boolean(mime) &&
		ALLOWED_MIME_PREFIXES.some(
			(prefix) => mime === prefix || mime.startsWith(prefix)
		);

	if (!hasAllowedExt && !hasAllowedMime) {
		return 'type';
	}

	if (size > MAX_EMAIL_ATTACHMENT_BYTES) {
		return 'size';
	}

	return null;
};

/**
 * Join a list of file names for display, truncating long lists so a notice
 * stays readable (e.g. "a.pdf, b.pdf and 2 more").
 */
const joinNames = (names: string[], max = 2): string => {
	if (names.length <= max) {
		return names.join(', ');
	}
	const shown = names.slice(0, max).join(', ');
	const remaining = names.length - max;
	return sprintf(
		/* translators: %1$s: comma-separated file names, %2$d: number of additional files */
		_n(
			'%1$s and %2$d more',
			'%1$s and %2$d more',
			remaining,
			'doublescale'
		),
		shown,
		remaining
	);
};

type AttachmentFeedback = {
	added: EmailAttachment[];
	rejectedByType: string[];
	rejectedBySize: string[];
	rejectedDuplicate: string[];
	rejectedOverLimit: string[];
};

const AttachmentsPanel: React.FC = () => {
	const dispatch = useDispatch();
	const { createNotice } = useDispatch('doublescale/core');
	const attachments = useSelect(
		(s) => s(STORE_KEY).getAttachments?.() ?? [],
		[]
	);

	/**
	 * Surface exactly what happened after a Media Library selection: what was
	 * added and, for anything rejected, the specific reason and file names.
	 */
	const showAttachmentFeedback = ({
		added,
		rejectedByType,
		rejectedBySize,
		rejectedDuplicate,
		rejectedOverLimit,
	}: AttachmentFeedback): void => {
		if (rejectedByType.length > 0) {
			createNotice({
				type: 'error',
				message: sprintf(
					/* translators: %1$s: file names, %2$s: list of allowed file types */
					__(
						'%1$s can\u2019t be attached. Only %2$s files are allowed.',
						'doublescale'
					),
					joinNames(rejectedByType),
					ALLOWED_TYPES_LABEL
				),
			});
		}

		if (rejectedBySize.length > 0) {
			createNotice({
				type: 'error',
				message: sprintf(
					/* translators: %1$s: file names, %2$s: max file size */
					__(
						'%1$s is too large. Each file must be under %2$s.',
						'doublescale'
					),
					joinNames(rejectedBySize),
					formatFileSize(MAX_EMAIL_ATTACHMENT_BYTES)
				),
			});
		}

		if (rejectedDuplicate.length > 0) {
			createNotice({
				type: 'error',
				message: sprintf(
					/* translators: %s: file names */
					__(
						'%s is already attached.',
						'doublescale'
					),
					joinNames(rejectedDuplicate)
				),
			});
		}

		if (rejectedOverLimit.length > 0) {
			createNotice({
				type: 'error',
				message: sprintf(
					/* translators: %d: maximum number of attachments */
					__(
						'You can attach up to %d files. Remove one to add more.',
						'doublescale'
					),
					MAX_EMAIL_ATTACHMENTS
				),
			});
		}

		if (added.length > 0) {
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
			return;
		}

		// Nothing rejected and nothing added means the user confirmed with an
		// empty selection.
		if (
			rejectedByType.length === 0 &&
			rejectedBySize.length === 0 &&
			rejectedDuplicate.length === 0 &&
			rejectedOverLimit.length === 0
		) {
			createNotice({
				type: 'error',
				message: __('No file was selected.', 'doublescale'),
			});
		}
	};

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

			// Track each rejection reason with the offending file name so the
			// user gets a specific, actionable message instead of silence.
			const rejectedByType: string[] = [];
			const rejectedBySize: string[] = [];
			const rejectedDuplicate: string[] = [];
			const rejectedOverLimit: string[] = [];

			selection.each((attachment: { toJSON: () => Record<string, unknown> }) => {
				const data = attachment.toJSON();
				const filename = getFilename(data);
				const mime = String(data.mime || data.mime_type || '');
				const size = Number(
					data.filesizeInBytes || data.filesize || 0
				);

				const reason = getRejectionReason(mime, size, filename);
				if (reason === 'type') {
					rejectedByType.push(filename);
					return;
				}
				if (reason === 'size') {
					rejectedBySize.push(filename);
					return;
				}

				const id = Number(data.id);
				if (
					id &&
					(current.some((item) => item.id === id) ||
						added.some((item) => item.id === id))
				) {
					rejectedDuplicate.push(filename);
					return;
				}

				if (!id) {
					rejectedByType.push(filename);
					return;
				}

				if (current.length + added.length >= MAX_EMAIL_ATTACHMENTS) {
					rejectedOverLimit.push(filename);
					return;
				}

				added.push({
					id,
					filename,
					mime: mime || 'application/octet-stream',
					size,
				});
			});

			if (added.length > 0) {
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
			}

			showAttachmentFeedback({
				added,
				rejectedByType,
				rejectedBySize,
				rejectedDuplicate,
				rejectedOverLimit,
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
						/* translators: %1$d: max files, %2$s: max size per file, %3$s: allowed file types */
						__(
							'Attach up to %1$d files (max %2$s each), sent with the email. Allowed types: %3$s.',
							'doublescale'
						),
						MAX_EMAIL_ATTACHMENTS,
						formatFileSize(MAX_EMAIL_ATTACHMENT_BYTES),
						ALLOWED_TYPES_LABEL
					)}
				</p>
			</div>

			{attachments.length > 0 && (
				<ul className="grid gap-2">
					{attachments.map((file) => (
						<li
							key={file.id}
							className="flex items-center gap-2 rounded-lg text-white bg-white/[0.05] px-3 py-2"
						>
							<AttachmentsIcon width={32} height={32} />
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
				<AttachmentsIcon width={32} height={32} />
				{__('Add attachment', 'doublescale')}
			</Button>
		</div>
	);
};

export default AttachmentsPanel;
