/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';

// WordPress media library types
declare global {
	interface Window {
		wp: {
			media: (options: any) => any;
		};
	}
}
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DeleteIcon, FileUploadIcon } from '@quillcrm/components';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@quillcrm/components/ui/select';

interface BackgroundImage {
	id: number;
	name: string;
	url: string;
	size: number;
}

interface Settings {
	backgroundColor: string;
	canvasColor: string;
	backgroundImage: BackgroundImage | null;
	backgroundRepeat: string;
	backgroundSize: string;
}

const BackgroundSettings: React.FC<{
	onBack: () => void;
}> = ({ onBack }) => {
	const [settings, setSettings] = useState<Settings>({
		backgroundColor: '#E3E5E8',
		canvasColor: '#627281',
		backgroundImage: null,
		backgroundRepeat: 'no-repeat',
		backgroundSize: 'cover',
	});

	// Check if WordPress media library is available when component mounts
	useEffect(() => {
		console.log('BackgroundSettings mounted. Checking wp.media availability...');
		console.log('window.wp:', typeof window.wp);
		console.log('window.wp?.media:', typeof window.wp?.media);

		// Wait a bit for WordPress to fully load
		const timer = setTimeout(() => {
			console.log('After delay - window.wp:', typeof window.wp);
			console.log('After delay - window.wp?.media:', typeof window.wp?.media);
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

	const handleInputChange = (field: keyof Settings, value: any) => {
		setSettings((prev) => ({ ...prev, [field]: value }));
	};

	const openMediaLibrary = () => {
		// Check if wp.media is available
		if (typeof window.wp !== 'undefined' && window.wp.media) {
			console.log('WordPress media library is available, opening media frame...');
			// Create the media frame
			const frame = window.wp.media({
				title: __('Select Background Image', 'quillcrm'),
				button: {
					text: __('Use this image', 'quillcrm'),
				},
				multiple: false,
				library: {
					type: 'image'
				}
			});

			// When an image is selected, run a callback
			frame.on('select', function () {
				// Get media attachment details from the frame state
				const attachment = frame.state().get('selection').first().toJSON();

				setSettings((prev) => ({
					...prev,
					backgroundImage: {
						id: attachment.id,
						name: attachment.filename || attachment.title,
						url: attachment.url,
						size: attachment.filesizeInBytes || 0,
					},
				}));
			});

			// Open the modal
			frame.open();
		} else {
			console.error('WordPress media library is not available. wp object:', typeof window.wp, 'wp.media:', typeof window.wp?.media);
			// Fallback to native file input if wp.media is not available
			document.getElementById('bg-upload')?.click();
		}
	};

	const handleReplaceImage = () => {
		// Same logic for replacing image
		if (typeof window.wp !== 'undefined' && window.wp.media) {
			const frame = window.wp.media({
				title: __('Replace Background Image', 'quillcrm'),
				button: {
					text: __('Use this image', 'quillcrm'),
				},
				multiple: false,
				library: {
					type: 'image'
				}
			});

			frame.on('select', function () {
				const attachment = frame.state().get('selection').first().toJSON();

				setSettings((prev) => ({
					...prev,
					backgroundImage: {
						id: attachment.id,
						name: attachment.filename || attachment.title,
						url: attachment.url,
						size: attachment.filesizeInBytes || 0,
					},
				}));
			});

			frame.open();
		} else {
			console.error('WordPress media library is not available');
			document.getElementById('bg-replace')?.click();
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
					setSettings((prev) => ({
						...prev,
						backgroundImage: {
							id: 0, // No ID for local files
							name: file.name,
							url: result,
							size: file.size,
						},
					}));
				}
			};
			reader.readAsDataURL(file);
		}
		// Reset the input value to allow re-uploading the same file
		e.target.value = '';
	};

	const handleDeleteImage = () => {
		setSettings((prev) => ({ ...prev, backgroundImage: null }));
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	return (
		<div>
			<div className="flex items-center justify-between border-b-2 px-4 pt-5 pb-4">
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={onBack}
						className="p-1 h-auto"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<h3 className="text-base text-[#333333]">
						{__('Background', 'quillcrm')}
					</h3>
				</div>
			</div>

			<div className="space-y-4 p-4">
				<div>
					<h2 className="text-[#333333]">
						{__('Background Image', 'quillcrm')}{' '}
					</h2>
					<p className="text-xs text-[#616161]">
						{__(
							'You can use JPG, PNG, and GIF formats, each under 2000px in dimension.',
							'quillcrm'
						)}
					</p>
				</div>

				{settings.backgroundImage ? (
					<div className="border rounded-lg p-4 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<img
								src={settings.backgroundImage.url}
								alt={settings.backgroundImage.name}
								className="w-8 h-8 object-cover"
							/>
							<div>
								<h4 className="text-sm text-[#333333] w-16 truncate">
									{settings.backgroundImage.name}
								</h4>
								<p className="text-xs text-[#6D6D6D]">
									{formatFileSize(
										settings.backgroundImage.size
									)}
								</p>
							</div>
						</div>
						<div className="flex gap-2 mt-2">
							{/* Hidden fallback input */}
							<Input
								type="file"
								accept="image/*"
								className="hidden"
								id="bg-replace"
								onChange={handleFileUpload}
							/>
							<Button
								variant="outline"
								size="sm"
								className="text-sm text-primary shadow-none"
								onClick={handleReplaceImage}
							>
								{__('Replace', 'quillcrm')}
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="text-destructive shadow-none"
								onClick={handleDeleteImage}
							>
								<DeleteIcon width={16} height={16} />
							</Button>
						</div>
					</div>
				) : (
					<div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
						{/* Hidden fallback input */}
						<Input
							type="file"
							onChange={handleFileUpload}
							accept="image/*"
							className="hidden"
							id="bg-upload"
						/>
						<div className="cursor-pointer" onClick={openMediaLibrary}>
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

				{/* Background Image Options - Only show when image is uploaded */}
				{settings.backgroundImage && (
					<div className="space-y-4">
						<div className="space-y-2">
							<label className="text-sm text-[#333333]">
								{__('Background Repeat', 'quillcrm')}
							</label>
							<Select
								value={settings.backgroundRepeat}
								onValueChange={(value) =>
									handleInputChange('backgroundRepeat', value)
								}
							>
								<SelectTrigger className="w-full rounded-lg bg-white h-12">
									<SelectValue
										placeholder={__(
											'Background Repeat',
											'quillcrm'
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="no-repeat">
										{__('No Repeat', 'quillcrm')}
									</SelectItem>
									<SelectItem value="repeat">
										{__('Repeat', 'quillcrm')}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Background Size */}
						<div className="space-y-2">
							<label className="text-sm text-[#333333]">
								{__('Background Size', 'quillcrm')}
							</label>
							<Select
								value={settings.backgroundSize}
								onValueChange={(value) =>
									handleInputChange('backgroundSize', value)
								}
							>
								<SelectTrigger className="w-full rounded-lg h-12 bg-white">
									<SelectValue
										placeholder={__(
											'Background Size',
											'quillcrm'
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="cover">
										{__('Cover', 'quillcrm')}
									</SelectItem>
									<SelectItem value="contain">
										{__('Contain', 'quillcrm')}
									</SelectItem>
									<SelectItem value="auto">
										{__('Auto', 'quillcrm')}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				)}

				{/* Background color */}
				<div className="space-y-2">
					<div className="text-sm text-[#333333]">
						{__('Background Color', 'quillcrm')}
					</div>
					<div className="flex items-center gap-2 border rounded-lg px-2">
						<Input
							id="bg-color"
							type="text"
							value={settings.backgroundColor}
							onChange={(e) =>
								handleInputChange(
									'backgroundColor',
									e.target.value
								)
							}
							className="rounded-lg"
							style={{ border: 0 }}
						/>
						<Input
							type="color"
							value={settings.backgroundColor}
							onChange={(e) =>
								handleInputChange(
									'backgroundColor',
									e.target.value
								)
							}
							className="w-10 h-10 p-1 rounded-lg"
							style={{ border: 0 }}
						/>
					</div>
				</div>

				{/* Canvas color */}
				<div className="space-y-2">
					<div className="text-sm text-[#333333]">
						{__('Canvas Color', 'quillcrm')}
					</div>
					<div className="flex items-center gap-2 border rounded-lg px-2">
						<Input
							id="canvas-color"
							type="text"
							value={settings.canvasColor}
							onChange={(e) =>
								handleInputChange('canvasColor', e.target.value)
							}
							className="rounded-lg"
							style={{ border: 0 }}
						/>
						<Input
							type="color"
							value={settings.canvasColor}
							onChange={(e) =>
								handleInputChange('canvasColor', e.target.value)
							}
							className="w-10 h-10 p-1 rounded-lg"
							style={{ border: 0 }}
						/>
					</div>
				</div>
			</div>

			{/* Save/Apply Button */}
			<div className="mt-6 pt-4 px-4 border-t border-border">
				<Button
					className="w-full h-10"
					onClick={() => {
						// Handle saving background settings
						console.log('Saving background settings:', settings);
						onBack();
					}}
				>
					{__('Apply Changes', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
};

export default BackgroundSettings;