/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
/**
 * external dependencies
 */
import React from 'react';

/**
 * internal dependencies
 */
import { PaddingControl, ColorPickerControl } from '../basic/shared';
import { BackgroundImageSection } from './components/BackgroundImageSection';
import ConditionalSectionModal from './components/ConditionalSectionModal';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { STORE_KEY } from '@/stores/email-builder/constants';
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

	const [showConditionsModal, setShowConditionsModal] = useState(false);

	// Get section to check if it has conditions
	const section = useSelect(
		(select) => {
			const sections = select(STORE_KEY).getSections();
			return sectionId ? sections.find((s: any) => s.id === sectionId) : null;
		},
		[sectionId]
	);

	const hasConditions = section?.conditions && section.conditions.length > 0;

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

			{/* Conditional Section Button */}
			{sectionId && (
				<div className="border-t pt-4">
					<Button
						variant={hasConditions ? 'default' : 'outline'}
						className="w-full"
						onClick={() => setShowConditionsModal(true)}
					>
						<Filter className="w-4 h-4 mr-2" />
						{hasConditions 
							? __('Edit Conditions', 'quillcrm')
							: __('Add Conditions', 'quillcrm')
						}
					</Button>
					{hasConditions && (
						<p className="text-xs text-gray-600 mt-2 text-center">
							{__('This section has conditional rendering', 'quillcrm')}
						</p>
					)}
				</div>
			)}

			{/* Conditional Section Modal */}
			{sectionId && (
				<ConditionalSectionModal
					sectionId={sectionId}
					visible={showConditionsModal}
					onClose={() => setShowConditionsModal(false)}
				/>
			)}
		</div>
	);
};

export default LayoutSettings;
export type { LayoutSettingsData };
