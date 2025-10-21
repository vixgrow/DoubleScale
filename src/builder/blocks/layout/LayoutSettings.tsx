/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';

/**
 * internal dependencies
 */
import { PaddingControl, ColorPickerControl } from '../basic/shared';
import { BackgroundImageSection } from './components/BackgroundImageSection';
import {
	useSectionSettings,
	LayoutSettingsData,
} from './hooks/useSectionSettings';

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
	const { settings, handleInputChange, handlePaddingChange } =
		useSectionSettings({
			onSettingsChange,
			initialSettings,
			sectionId,
		});

	return (
		<div className="space-y-4 p-4">
			<BackgroundImageSection
				backgroundImage={settings.backgroundImage}
				backgroundRepeat={settings.backgroundRepeat}
				backgroundSize={settings.backgroundSize}
				backgroundPosition={settings.backgroundPosition}
				onBackgroundImageChange={(image) =>
					handleInputChange('backgroundImage', image)
				}
				onBackgroundRepeatChange={(value) =>
					handleInputChange('backgroundRepeat', value)
				}
				onBackgroundSizeChange={(value) =>
					handleInputChange('backgroundSize', value)
				}
				onBackgroundPositionChange={(value) =>
					handleInputChange('backgroundPosition', value)
				}
			/>

			<ColorPickerControl
				value={settings.backgroundColor}
				onChange={(value) =>
					handleInputChange('backgroundColor', value)
				}
				label={__('Background Color', 'quillcrm')}
				id="layout-bg-color"
			/>

			<PaddingControl
				value={settings.padding}
				onChange={handlePaddingChange}
			/>
		</div>
	);
};

export default LayoutSettings;
export type { LayoutSettingsData };
