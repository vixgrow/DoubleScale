/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
/**
 * external dependencies
 */
import React from 'react';
/**
 * internal dependencies
 */
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@doublescale/components/ui/select';
import { ImageUploadControl, ColorPickerControl } from '../blocks/basic/shared';
import { STORE_KEY } from '../../stores/email-builder/constants';

const BackgroundSettings: React.FC = () => {
	const dispatch = useDispatch();
	const settings = useSelect(
		(select) => select(STORE_KEY).getGlobalSettings(),
		[]
	);

	const handleInputChange = (field: string, value: unknown) => {
		dispatch(STORE_KEY).updateGlobalSettings({ [field]: value });
	};

	const handleImageChange = (updates: { src: string; alt: string }) => {
		if (updates.src) {
			dispatch(STORE_KEY).updateGlobalSettings({
				backgroundImage: {
					id: 0,
					name: updates.alt || 'Background Image',
					url: updates.src,
					size: 0,
				},
			});
		} else {
			dispatch(STORE_KEY).updateGlobalSettings({ backgroundImage: null });
		}
	};

	return (
		<div className="space-y-4 [&_label]:text-white">
			<ImageUploadControl
				label={__('Background Image', 'doublescale')}
				description={__(
					'You can use JPG, PNG, and GIF formats, each under 2000px in dimension.',
					'doublescale'
				)}
				value={settings.backgroundImage?.url || ''}
				alt={settings.backgroundImage?.name || 'Background Image'}
				onChange={handleImageChange}
				uploadId="background-image"
			/>

			{settings.backgroundImage && (
				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm text-white">
							{__('Background Repeat', 'doublescale')}
						</label>
						<Select
							value={settings.backgroundRepeat}
							onValueChange={(value) =>
								handleInputChange('backgroundRepeat', value)
							}
						>
							<SelectTrigger className="h-11 w-full rounded-lg !border-none !ring-0 !ring-offset-0 !text-white"
							style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
							>
								<SelectValue
									placeholder={__(
										'Background Repeat',
										'doublescale'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="no-repeat">
									{__('No Repeat', 'doublescale')}
								</SelectItem>
								<SelectItem value="repeat">
									{__('Repeat', 'doublescale')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-white">
							{__('Background Size', 'doublescale')}
						</label>
						<Select
							value={settings.backgroundSize}
							onValueChange={(value) =>
								handleInputChange('backgroundSize', value)
							}
						>
							<SelectTrigger className="h-11 w-full rounded-lg !border-none !ring-0 !ring-offset-0 !text-white"
							style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
							>
								<SelectValue
									placeholder={__(
										'Background Size',
										'doublescale'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="cover">
									{__('Cover', 'doublescale')}
								</SelectItem>
								<SelectItem value="contain">
									{__('Contain', 'doublescale')}
								</SelectItem>
								<SelectItem value="auto">
									{__('Auto', 'doublescale')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			)}

			<ColorPickerControl
				label={__('Canvas Color', 'doublescale')}
				value={settings.canvasColor}
				onChange={(value) => handleInputChange('canvasColor', value)}
				id="canvas-color"
				placeholder="#ffffff"
			/>
		</div>
	);
};

export default BackgroundSettings;
