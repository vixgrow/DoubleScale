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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@quillcrm/components/ui/select';
import {
	PaddingControl,
	PaddingValue,
	ColorPickerControl,
	ImageUploadControl,
} from '../basic/shared';
import { STORE_KEY } from '../../../stores/email-builder/constants';

interface BackgroundImage {
	id: number;
	name: string;
	url: string;
	size: number;
}

interface LayoutSettingsData {
	backgroundColor: string;
	backgroundImage: BackgroundImage | null;
	backgroundRepeat: string;
	backgroundSize: string;
	backgroundPosition: string;
	padding: PaddingValue;
}

interface LayoutSettingsProps {
	onSettingsChange?: (settings: LayoutSettingsData) => void;
	initialSettings?: Partial<LayoutSettingsData>;
	sectionId?: string;
}

const LayoutSettings: React.FC<LayoutSettingsProps> = ({
	onSettingsChange,
	initialSettings = {},
	sectionId,
}) => {
	// Get the current section data
	const sections = useSelect((select) => select(STORE_KEY).getSections(), []);
	const currentSection = sectionId
		? sections.find((s) => s.id === sectionId)
		: null;

	// Convert section styles to LayoutSettingsData format
	const convertSectionStylesToSettings = (
		section: any
	): Partial<LayoutSettingsData> => {
		if (!section?.styles) return {};

		const styles = section.styles;
		const padding = styles.padding || '20px';

		// Parse padding string (e.g., "20px 30px 20px 30px" or "20px")
		let paddingValues = { top: 20, right: 20, bottom: 20, left: 20 };
		if (typeof padding === 'string') {
			const paddingArray = padding
				.split(' ')
				.map((p) => parseInt(p.replace('px', '')) || 0);
			if (paddingArray.length === 1) {
				paddingValues = {
					top: paddingArray[0],
					right: paddingArray[0],
					bottom: paddingArray[0],
					left: paddingArray[0],
				};
			} else if (paddingArray.length === 2) {
				paddingValues = {
					top: paddingArray[0],
					right: paddingArray[1],
					bottom: paddingArray[0],
					left: paddingArray[1],
				};
			} else if (paddingArray.length === 4) {
				paddingValues = {
					top: paddingArray[0],
					right: paddingArray[1],
					bottom: paddingArray[2],
					left: paddingArray[3],
				};
			}
		}

		// Extract background image URL from backgroundImage style
		let backgroundImage: BackgroundImage | null = null;
		if (styles.backgroundImage && styles.backgroundImage !== 'none') {
			const urlMatch = styles.backgroundImage.match(
				/url\(['"]?([^'"]+)['"]?\)/
			);
			if (urlMatch) {
				backgroundImage = {
					id: 0,
					name: 'Background Image',
					url: urlMatch[1],
					size: 0,
				};
			}
		}

		return {
			backgroundColor: styles.backgroundColor || '#ffffff',
			backgroundImage,
			backgroundRepeat: styles.backgroundRepeat || 'no-repeat',
			backgroundSize: styles.backgroundSize || 'cover',
			backgroundPosition: styles.backgroundPosition || 'center',
			padding: paddingValues,
		};
	};

	const [settings, setSettings] = useState<LayoutSettingsData>(() => {
		const defaultSettings = {
			backgroundColor: '#ffffff',
			backgroundImage: null,
			backgroundRepeat: 'no-repeat',
			backgroundSize: 'cover',
			backgroundPosition: 'center',
			padding: {
				top: 20,
				right: 20,
				bottom: 20,
				left: 20,
			},
		};

		// Load current section styles if available
		if (currentSection) {
			const sectionSettings =
				convertSectionStylesToSettings(currentSection);
			return { ...defaultSettings, ...sectionSettings };
		}

		return { ...defaultSettings, ...initialSettings };
	});

	// Update settings when initialSettings or currentSection change
	useEffect(() => {
		if (currentSection) {
			const sectionSettings =
				convertSectionStylesToSettings(currentSection);
			setSettings((prev) => ({
				...prev,
				...sectionSettings,
			}));
		} else if (initialSettings) {
			setSettings((prev) => ({
				...prev,
				...initialSettings,
			}));
		}
	}, [initialSettings, currentSection]);

	const handleInputChange = (field: keyof LayoutSettingsData, value: any) => {
		const newSettings = { ...settings, [field]: value };
		setSettings(newSettings);
		onSettingsChange?.(newSettings);
	};

	const handlePaddingChange = (padding: PaddingValue) => {
		const newSettings = { ...settings, padding };
		setSettings(newSettings);
		onSettingsChange?.(newSettings);
	};

	return (
		<div className="space-y-4 p-4">
			{/* Background Image Section */}
			<ImageUploadControl
				label={__('Background Image', 'quillcrm')}
				description={__(
					'You can use JPG, PNG, and GIF formats, each under 2000px in dimension.',
					'quillcrm'
				)}
				value={settings.backgroundImage?.url || ''}
				alt={settings.backgroundImage?.name || 'Background Image'}
				onChange={({ src, alt }) => {
					if (src) {
						const newSettings = {
							...settings,
							backgroundImage: {
								id: settings.backgroundImage?.id || 0,
								name: alt,
								url: src,
								size: settings.backgroundImage?.size || 0,
							},
						};
						setSettings(newSettings);
						onSettingsChange?.(newSettings);
					} else {
						const newSettings = {
							...settings,
							backgroundImage: null,
						};
						setSettings(newSettings);
						onSettingsChange?.(newSettings);
					}
				}}
				uploadId="layout-bg-upload"
				placeholder={__('No background image selected', 'quillcrm')}
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
							<SelectTrigger className="w-full rounded-lg bg-white h-10">
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
								<SelectItem value="repeat-x">
									{__('Repeat X', 'quillcrm')}
								</SelectItem>
								<SelectItem value="repeat-y">
									{__('Repeat Y', 'quillcrm')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

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
							<SelectTrigger className="w-full rounded-lg h-10 bg-white">
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
								<SelectItem value="100% 100%">
									{__('Stretch', 'quillcrm')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm text-[#333333]">
							{__('Background Position', 'quillcrm')}
						</label>
						<Select
							value={settings.backgroundPosition}
							onValueChange={(value) =>
								handleInputChange('backgroundPosition', value)
							}
						>
							<SelectTrigger className="w-full rounded-lg h-10 bg-white">
								<SelectValue
									placeholder={__(
										'Background Position',
										'quillcrm'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="center">
									{__('Center', 'quillcrm')}
								</SelectItem>
								<SelectItem value="top">
									{__('Top', 'quillcrm')}
								</SelectItem>
								<SelectItem value="bottom">
									{__('Bottom', 'quillcrm')}
								</SelectItem>
								<SelectItem value="left">
									{__('Left', 'quillcrm')}
								</SelectItem>
								<SelectItem value="right">
									{__('Right', 'quillcrm')}
								</SelectItem>
								<SelectItem value="top left">
									{__('Top Left', 'quillcrm')}
								</SelectItem>
								<SelectItem value="top right">
									{__('Top Right', 'quillcrm')}
								</SelectItem>
								<SelectItem value="bottom left">
									{__('Bottom Left', 'quillcrm')}
								</SelectItem>
								<SelectItem value="bottom right">
									{__('Bottom Right', 'quillcrm')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			)}

			{/* Background Color */}
			<ColorPickerControl
				label={__('Background Color', 'quillcrm')}
				value={settings.backgroundColor}
				onChange={(value) =>
					handleInputChange('backgroundColor', value)
				}
				id="layout-bg-color"
				placeholder="#ffffff"
			/>

			{/* Padding Control */}
			<PaddingControl
				value={settings.padding}
				onChange={handlePaddingChange}
				label={__('Template Padding', 'quillcrm')}
			/>
		</div>
	);
};

export default LayoutSettings;
