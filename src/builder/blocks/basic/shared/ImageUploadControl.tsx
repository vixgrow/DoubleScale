/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
/**
 * external dependencies
 */
import React, { useState, useEffect } from 'react';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { DeleteIcon, ImageUploadDropzoneIcon } from '@doublescale/components';
import { cn } from '@/lib/utils';
import { generateRandomString } from '@/builder/utils/idGenerator';
import { LinkInput } from './LinkInput';

// WordPress media library types
declare global {
	interface Window {
		wp: {
			media: (options: any) => any;
		};
	}
}

interface ImageData {
	id: number;
	name: string;
	url: string;
	size: number;
}

export interface ImageUploadControlProps {
	label: string;
	description?: string;
	value: string;
	alt?: string; // Made optional for simpleMode
	onChange: (updates: { src: string; alt: string }) => void;
	uploadId: string;
	placeholder?: string;
	showRotation?: boolean;
	rotation?: number;
	onRotationChange?: (rotation: number) => void;
	// New props for enhanced functionality
	onModalStateChange?: (isOpen: boolean) => void;
	simpleMode?: boolean; // For URL-only mode without alt text requirement
	disabled?: boolean;
	enableUrl?: boolean; // Enable URL input via popover
}

function ImageUploadDropzoneFrame({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative min-h-[120px] w-full min-w-0 max-w-full overflow-hidden rounded-xl bg-white/[0.04]">
			<svg
				className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.38]"
				xmlns="http://www.w3.org/2000/svg"
				preserveAspectRatio="none"
				aria-hidden
			>
				<rect
					x="0.75"
					y="0.75"
					width="calc(100% - 1.5px)"
					height="calc(100% - 1.5px)"
					rx="12"
					ry="12"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeDasharray="18 12"
					vectorEffect="nonScalingStroke"
				/>
			</svg>
			<div className="relative flex flex-col items-center justify-center px-3 py-5 text-center">
				{children}
			</div>
		</div>
	);
}

function ImageUploadDropzoneCopy() {
	return (
		<>
			<div className="mb-2 flex justify-center text-white">
				<ImageUploadDropzoneIcon width={40} height={40} />
			</div>
			<p className="max-w-full text-sm leading-snug text-white break-words">
				<span className="underline decoration-white/80 underline-offset-2">
					{__('Click to Upload', 'doublescale')}
				</span>
				<span className="text-white/90">
					{' '}
					{__('or drag and drop', 'doublescale')}
				</span>
			</p>
			<p className="mt-2 text-xs text-white/55">
				{__('(Max. File size: 25 MB)', 'doublescale')}
			</p>
		</>
	);
}

export const ImageUploadControl: React.FC<ImageUploadControlProps> = ({
	label,
	description,
	value,
	alt = '',
	onChange,
	uploadId,
	showRotation = false,
	rotation = 0,
	onModalStateChange,
	simpleMode = false,
	disabled = false,
	enableUrl = false,
}) => {
	const [imageData, setImageData] = useState<ImageData | null>(null);
	const [uniqueUploadId] = useState(
		() => `${uploadId}-${generateRandomString()}`
	);
	const [popoverOpen, setPopoverOpen] = useState(false);
	const [mode, setMode] = useState<'upload' | 'url' | null>(null);
	const [urlValue, setUrlValue] = useState('');

	// Check if merge tags modal is visible to prevent popover from closing
	const mergeTagsVisible = useSelect(
		(select) => select('doublescale/core').getMergeTagsVisible(),
		[]
	);

	// Reset imageData when value becomes empty
	useEffect(() => {
		if (!value || value.trim() === '') {
			setImageData(null);
		}
	}, [value]);

	// Sync urlValue with value when value changes externally
	useEffect(() => {
		if (value && value.trim() !== '') {
			setUrlValue(value);
		}
	}, [value]);

	// Keep popover open when merge tags modal is visible
	useEffect(() => {
		if (mergeTagsVisible && mode === 'url') {
			setPopoverOpen(true);
		}
	}, [mergeTagsVisible, mode]);

	const openMediaLibrary = (closePopover = false) => {
		if (disabled) return;

		if (closePopover) {
			setPopoverOpen(false);
			setMode(null);
		}

		// Check if wp.media is available
		if (typeof window.wp !== 'undefined' && window.wp.media) {
			const frame = window.wp.media({
				title: __('Select Image', 'doublescale'),
				button: {
					text: __('Use this image', 'doublescale'),
				},
				multiple: false,
				library: {
					type: 'image',
				},
			});

			// When an image is selected, run a callback
			frame.on('select', function () {
				// Get media attachment details from the frame state
				const attachment = frame
					.state()
					.get('selection')
					.first()
					.toJSON();

				setImageData({
					id: attachment.id,
					name: attachment.filename || attachment.title,
					url: attachment.url,
					size: attachment.filesizeInBytes || 0,
				});

				onChange({
					src: attachment.url,
					alt: simpleMode
						? ''
						: attachment.alt || attachment.title || label,
				});

				onModalStateChange?.(false);
			});

			// Handle modal close without selection
			frame.on('close', function () {
				onModalStateChange?.(false);
			});

			// Handle modal open
			frame.on('open', function () {
				onModalStateChange?.(true);

				// Set a higher z-index for the media modal to prevent conflicts
				setTimeout(() => {
					const mediaModal = document.querySelector('.media-modal');
					const mediaModalBackdrop = document.querySelector(
						'.media-modal-backdrop'
					);

					if (mediaModal) {
						(mediaModal as HTMLElement).style.zIndex = '999999';
					}
					if (mediaModalBackdrop) {
						(mediaModalBackdrop as HTMLElement).style.zIndex =
							'999998';
					}
				}, 10);
			});

			// Open the modal
			frame.open();
		} else {
			document.getElementById(`${uniqueUploadId}-upload`)?.click();
		}
	};

	const handleReplaceImage = () => {
		if (disabled) return;

		// If enableUrl is true, show popover instead of directly opening media library
		if (enableUrl) {
			setPopoverOpen(true);
			setMode(null);
			return;
		}

		// Same logic for replacing image
		if (typeof window.wp !== 'undefined' && window.wp.media) {
			const frame = window.wp.media({
				title: __('Replace Image', 'doublescale'),
				button: {
					text: __('Use this image', 'doublescale'),
				},
				multiple: false,
				library: {
					type: 'image',
				},
			});

			frame.on('select', function () {
				const attachment = frame
					.state()
					.get('selection')
					.first()
					.toJSON();

				setImageData({
					id: attachment.id,
					name: attachment.filename || attachment.title,
					url: attachment.url,
					size: attachment.filesizeInBytes || 0,
				});

				onChange({
					src: attachment.url,
					alt: simpleMode
						? ''
						: attachment.alt || attachment.title || label,
				});

				onModalStateChange?.(false);
			});

			// Handle modal close without selection
			frame.on('close', function () {
				onModalStateChange?.(false);
			});

			// Handle modal open
			frame.on('open', function () {
				onModalStateChange?.(true);

				// Set a higher z-index for the media modal to prevent conflicts
				setTimeout(() => {
					const mediaModal = document.querySelector('.media-modal');
					const mediaModalBackdrop = document.querySelector(
						'.media-modal-backdrop'
					);

					if (mediaModal) {
						(mediaModal as HTMLElement).style.zIndex = '999999';
					}
					if (mediaModalBackdrop) {
						(mediaModalBackdrop as HTMLElement).style.zIndex =
							'999998';
					}
				}, 10);
			});

			frame.open();
		} else {
			document.getElementById(`${uniqueUploadId}-replace`)?.click();
		}
	};

	// Fallback file upload handler for when wp.media is not available
	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				const result = event.target?.result;
				if (typeof result === 'string') {
					setImageData({
						id: 0, // No ID for local files
						name: file.name,
						url: result,
						size: file.size,
					});

					onChange({
						src: result,
						alt: file.name,
					});
				}
			};
			reader.readAsDataURL(file);
		}
		// Reset the input value to allow re-uploading the same file
		e.target.value = '';
	};

	const handleDeleteImage = () => {
		if (disabled) return;

		setImageData(null);
		onChange({
			src: '',
			alt: simpleMode ? '' : label,
		});
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const handlePopoverOpenChange = (open: boolean) => {
		// Don't close popover if merge tags modal is visible
		if (!open && mergeTagsVisible) {
			return;
		}
		setPopoverOpen(open);
		if (!open) {
			setMode(null);
			setUrlValue(value);
		} else {
			// Reset mode when opening
			setMode(null);
		}
	};

	const handleTriggerClick = () => {
		if (!disabled) {
			setPopoverOpen(!popoverOpen);
			setMode(null);
		}
	};

	const handleUploadClick = () => {
		setMode('upload');
		setPopoverOpen(false);
		// Small delay to allow popover to close before opening media library
		setTimeout(() => {
			openMediaLibrary();
		}, 100);
	};

	const handleUrlClick = () => {
		setMode('url');
		setUrlValue(value);
	};

	const handleUrlSubmit = () => {
		if (urlValue && urlValue.trim() !== '') {
			onChange({
				src: urlValue.trim(),
				alt: alt || label,
			});
			setPopoverOpen(false);
			setMode(null);
		}
	};

	const handleUploadAreaClick = () => {
		if (disabled) return;
		openMediaLibrary();
	};

	// Render popover content (reusable)
	const renderPopoverContent = () => (
		<PopoverContent
			className="w-80 p-0"
			align="start"
			onInteractOutside={(e) => {
				// Prevent closing when merge tags modal is visible
				if (mergeTagsVisible) {
					e.preventDefault();
				}
			}}
		>
			{!mode ? (
				<div className="p-2 space-y-2">
					<Button
						variant="ghost"
						className="w-full justify-start px-2"
						onClick={handleUploadClick}
					>
						{__('Upload from Media Library', 'doublescale')}
					</Button>
					<Button
						variant="ghost"
						className="w-full justify-start px-2"
						onClick={handleUrlClick}
					>
						{__('Insert URL', 'doublescale')}
					</Button>
				</div>
			) : mode === 'url' ? (
				<div className="p-2 space-y-4">
					<LinkInput
						label={__('Image URL', 'doublescale')}
						value={urlValue}
						onChange={setUrlValue}
						placeholder="https://example.com/image.jpg"
					/>
					<div className="flex gap-2 justify-end">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setMode(null);
								setUrlValue(value || '');
							}}
						>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button
							size="sm"
							onClick={handleUrlSubmit}
							disabled={!urlValue || urlValue.trim() === ''}
						>
							{__('Insert', 'doublescale')}
						</Button>
					</div>
				</div>
			) : null}
		</PopoverContent>
	);

	const filledCardClass =
		'mt-2 flex w-full min-w-0 max-w-full flex-col gap-3 rounded-lg p-3';
	const filledTitleClass = 'truncate text-sm text-white max-w-[200px]';
	const filledMetaClass = 'truncate text-xs text-white/55';
	const outlineActionClass =
		'text-sm shadow-none text-white border-white/25 bg-transparent hover:bg-white/10 hover:text-white';
	const outlineDeleteClass =
		'shadow-none text-red-300 border-white/25 bg-transparent hover:bg-white/10 hover:text-red-200';

	return (
		<div className="w-full min-w-0 max-w-full">
			<label className="mb-2 block text-sm text-white">{label}</label>
			{description && (
				<p className="mb-3 max-w-full text-xs text-white/55 break-words">
					{description}
				</p>
			)}

			{imageData || (value && value.trim() !== '') ? (
				<div className={filledCardClass} style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
					<div className="flex min-w-0 items-center gap-2">
						<img
							src={value}
							alt={alt}
							className="h-8 w-8 shrink-0 rounded object-cover"
							{...(showRotation && {
								style: { transform: `rotate(${rotation}deg)` },
							})}
						/>
						<div className="min-w-0 flex-1">
							<h4 className={filledTitleClass}>
								{imageData?.name || alt}
							</h4>
							{imageData && (
								<p className={filledMetaClass}>
									{formatFileSize(imageData.size)}
								</p>
							)}
						</div>
					</div>
					<div className="flex w-full min-w-0 gap-2">
						<Input
							type="file"
							accept="image/*"
							className="hidden"
							id={`${uniqueUploadId}-replace`}
							onChange={handleFileUpload}
						/>
						{enableUrl ? (
							<Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
								<PopoverAnchor asChild>
									<Button
										variant="outline"
										size="sm"
										className={cn(
											outlineActionClass,
											'min-w-0 flex-1'
										)}
										disabled={disabled}
										onClick={handleTriggerClick}
									>
										<span className="truncate">
											{__('Replace', 'doublescale')}
										</span>
									</Button>
								</PopoverAnchor>
								{renderPopoverContent()}
							</Popover>
						) : (
							<Button
								variant="outline"
								size="sm"
								className={cn(outlineActionClass, 'min-w-0 flex-1')}
								onClick={handleReplaceImage}
								disabled={disabled}
							>
								<span className="truncate">
									{__('Replace', 'doublescale')}
								</span>
							</Button>
						)}
						<Button
							variant="outline"
							size="sm"
							className={cn(outlineDeleteClass, 'shrink-0')}
							onClick={handleDeleteImage}
							disabled={disabled}
						>
							<DeleteIcon width={16} height={16} />
						</Button>
					</div>
				</div>
			) : enableUrl ? (
				<div className="mt-2">
					<Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
						<PopoverAnchor asChild>
							<button
								type="button"
								disabled={disabled}
								aria-label={__(
									'Choose upload or image URL',
									'doublescale'
								)}
								onClick={handleTriggerClick}
								className={cn(
									'mt-2 w-full border-0 bg-transparent p-0 text-left transition-opacity',
									disabled
										? 'cursor-not-allowed opacity-50'
										: 'cursor-pointer'
								)}
							>
								<Input
									type="file"
									onChange={handleFileUpload}
									accept="image/*"
									className="hidden"
									id={`${uniqueUploadId}-upload`}
									disabled={disabled}
								/>
								<ImageUploadDropzoneFrame>
									<ImageUploadDropzoneCopy />
								</ImageUploadDropzoneFrame>
							</button>
						</PopoverAnchor>
						{renderPopoverContent()}
					</Popover>
				</div>
			) : (
				<div
					className={cn(
						'mt-2',
						disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
					)}
					role="button"
					tabIndex={disabled ? -1 : 0}
					aria-label={__('Upload image', 'doublescale')}
					{...(disabled ? { 'aria-disabled': true } : {})}
					onClick={() => !disabled && handleUploadAreaClick()}
					onKeyDown={(e) => {
						if (disabled) return;
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							handleUploadAreaClick();
						}
					}}
				>
					<Input
						type="file"
						onChange={handleFileUpload}
						accept="image/*"
						className="hidden"
						id={`${uniqueUploadId}-upload`}
						disabled={disabled}
					/>
					<ImageUploadDropzoneFrame>
						<ImageUploadDropzoneCopy />
					</ImageUploadDropzoneFrame>
				</div>
			)}
		</div>
	);
};
