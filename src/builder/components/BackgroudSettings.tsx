/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
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
	file: File;
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

	const handleInputChange = (field: keyof Settings, value: any) => {
		setSettings((prev) => ({ ...prev, [field]: value }));
	};

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
							file,
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
							<input
								type="file"
								accept="image/*"
								className="hidden"
								id="bg-replace"
								onChange={handleFileUpload}
							/>
							<label htmlFor="bg-replace">
								<Button
									variant="outline"
									size="sm"
									className="text-sm text-primary shadow-none"
									asChild
								>
									<label htmlFor="bg-replace">
										{__('Replace', 'quillcrm')}
									</label>
								</Button>
							</label>
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
						<input
							type="file"
							onChange={handleFileUpload}
							accept="image/*"
							className="hidden"
							id="bg-upload"
						/>
						<label htmlFor="bg-upload" className="cursor-pointer">
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
						</label>
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
