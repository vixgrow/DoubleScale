/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
/**
 * external dependencies
 */
import React from 'react';
import { ChevronLeft } from 'lucide-react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@quillcrm/components/ui/select';
import { ImageUploadControl, ColorPickerControl } from '../blocks/basic/shared';
import { STORE_KEY } from '../../stores/email-builder/constants';


const BackgroundSettings: React.FC<{
	onBack: () => void;
}> = ({ onBack }) => {
	const dispatch = useDispatch();
	const settings = useSelect((select) => select(STORE_KEY).getGlobalSettings(), []);

	const handleInputChange = (field: string, value: any) => {
		dispatch(STORE_KEY).updateGlobalSettings({ [field]: value });
	};

	const handleImageChange = (updates: { src: string; alt: string }) => {
		if (updates.src) {
			// When an image is uploaded, we need to create the backgroundImage object
			// The ImageUploadControl doesn't provide the full metadata, so we'll use what we have
			dispatch(STORE_KEY).updateGlobalSettings({
				backgroundImage: {
					id: 0, // Will be updated when using WordPress media library
					name: updates.alt || 'Background Image',
					url: updates.src,
					size: 0, // Will be updated when using WordPress media library
				},
			});
		} else {
			// When image is deleted
			dispatch(STORE_KEY).updateGlobalSettings({ backgroundImage: null });
		}
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
				{/* Background Image Upload */}
				<ImageUploadControl
					label={__('Background Image', 'quillcrm')}
					description={__(
						'You can use JPG, PNG, and GIF formats, each under 2000px in dimension.',
						'quillcrm'
					)}
					value={settings.backgroundImage?.url || ''}
					alt={settings.backgroundImage?.name || 'Background Image'}
					onChange={handleImageChange}
					uploadId="background-image"
				/>

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

				{/* Canvas Color */}
				<ColorPickerControl
					label={__('Canvas Color', 'quillcrm')}
					value={settings.canvasColor}
					onChange={(value) => handleInputChange('canvasColor', value)}
					id="canvas-color"
					placeholder="#ffffff"
				/>
			</div>
		</div>
	);
};

export default BackgroundSettings;