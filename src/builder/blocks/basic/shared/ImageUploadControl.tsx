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
import { DeleteIcon, FileUploadIcon } from '@quillcrm/components';
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
		(select) => select('quillcrm/core').getMergeTagsVisible(),
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

	// Check if WordPress media library is available when component mounts
	useEffect(() => {
		console.log(
			`${uniqueUploadId} mounted. Checking wp.media availability...`
		);
		console.log('window.wp:', typeof window.wp);
		console.log('window.wp?.media:', typeof window.wp?.media);
	}, [uniqueUploadId]);

	const openMediaLibrary = (closePopover = false) => {
		if (disabled) return;

		if (closePopover) {
			setPopoverOpen(false);
			setMode(null);
		}

		// Check if wp.media is available
		if (typeof window.wp !== 'undefined' && window.wp.media) {
			console.log(
				'WordPress media library is available, opening media frame...'
			);
			// Create the media frame
			const frame = window.wp.media({
				title: __('Select Image', 'quillcrm'),
				button: {
					text: __('Use this image', 'quillcrm'),
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
			console.error(
				'WordPress media library is not available. wp object:',
				typeof window.wp,
				'wp.media:',
				typeof window.wp?.media
			);
			// Fallback to native file input if wp.media is not available
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
				title: __('Replace Image', 'quillcrm'),
				button: {
					text: __('Use this image', 'quillcrm'),
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
			console.error('WordPress media library is not available');
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
						{__('Upload from Media Library', 'quillcrm')}
					</Button>
					<Button
						variant="ghost"
						className="w-full justify-start px-2"
						onClick={handleUrlClick}
					>
						{__('Insert URL', 'quillcrm')}
					</Button>
				</div>
			) : mode === 'url' ? (
				<div className="p-2 space-y-4">
					<LinkInput
						label={__('Image URL', 'quillcrm')}
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
							{__('Cancel', 'quillcrm')}
						</Button>
						<Button
							size="sm"
							onClick={handleUrlSubmit}
							disabled={!urlValue || urlValue.trim() === ''}
						>
							{__('Insert', 'quillcrm')}
						</Button>
					</div>
				</div>
			) : null}
		</PopoverContent>
	);

	return (
		<div>
			<label className="text-[#333333] mb-2 text-base">{label}</label>
			{description && (
				<p className="text-xs text-[#616161] mb-4">{description}</p>
			)}

			{imageData || (value && value.trim() !== '') ? (
				<div className="border rounded-lg p-4 bg-white flex items-center justify-between mt-2">
					<div className="flex items-center gap-3">
						<img
							src={value}
							alt={alt}
							className="w-8 h-8 object-cover"
							{...(showRotation && {
								style: { transform: `rotate(${rotation}deg)` },
							})}
						/>
						<div>
							<h4 className="text-sm text-[#333333] w-16 truncate">
								{imageData?.name || alt}
							</h4>
							{imageData && (
								<p className="text-xs text-[#6D6D6D]">
									{formatFileSize(imageData.size)}
								</p>
							)}
						</div>
					</div>
					<div className="flex gap-2 mt-2">
						{/* Hidden fallback input */}
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
										className="text-sm text-primary shadow-none"
										disabled={disabled}
										onClick={handleTriggerClick}
									>
										{__('Replace', 'quillcrm')}
									</Button>
								</PopoverAnchor>
								{renderPopoverContent()}
							</Popover>
						) : (
							<Button
								variant="outline"
								size="sm"
								className="text-sm text-primary shadow-none"
								onClick={handleReplaceImage}
								disabled={disabled}
							>
								{__('Replace', 'quillcrm')}
							</Button>
						)}
						<Button
							variant="outline"
							size="sm"
							className="text-destructive shadow-none"
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
								onClick={handleTriggerClick}
								className={`w-full border-2 border-dashed mt-2 bg-white rounded-lg p-4 text-center transition-colors ${disabled
									? 'cursor-not-allowed opacity-50'
									: 'cursor-pointer hover:border-gray-400'
									}`}
							>
								{/* Hidden fallback input */}
								<Input
									type="file"
									onChange={handleFileUpload}
									accept="image/*"
									className="hidden"
									id={`${uniqueUploadId}-upload`}
									disabled={disabled}
								/>
								<div className="flex flex-col items-center justify-center">
									<div className="text-primary bg-accent rounded-full p-2 mb-2">
										<FileUploadIcon />
									</div>
									<div className="flex items-center gap-1">
										<div className="text-primary">
											{__('Click to Upload', 'quillcrm')}
										</div>
										<div className="text-sm text-[#353535]">
											{__('or drag and drop', 'quillcrm')}
										</div>
									</div>
									<div className="text-xs text-[#353535]">
										{__('(Max. File size: 25 MB)', 'quillcrm')}
									</div>
								</div>
							</button>
						</PopoverAnchor>
						{renderPopoverContent()}
					</Popover>
				</div>
			) : (
				<div
					className={`border-2 border-dashed mt-2 bg-white rounded-lg p-4 text-center transition-colors ${disabled
						? 'cursor-not-allowed opacity-50'
						: 'cursor-pointer hover:border-gray-400'
						}`}
				>
					{/* Hidden fallback input */}
					<Input
						type="file"
						onChange={handleFileUpload}
						accept="image/*"
						className="hidden"
						id={`${uniqueUploadId}-upload`}
						disabled={disabled}
					/>
					<div
						className={
							disabled ? 'cursor-not-allowed' : 'cursor-pointer'
						}
						onClick={handleUploadAreaClick}
					>
						<div className="flex flex-col items-center justify-center">
							<div className="text-primary bg-accent rounded-full p-2 mb-2">
								<FileUploadIcon />
							</div>
							<div className="flex items-center gap-1">
								<div className="text-primary">
									{__('Click to Upload', 'quillcrm')}
								</div>
								<div className="text-sm text-[#353535]">
									{__('or drag and drop', 'quillcrm')}
								</div>
							</div>
							<div className="text-xs text-[#353535]">
								{__('(Max. File size: 25 MB)', 'quillcrm')}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
