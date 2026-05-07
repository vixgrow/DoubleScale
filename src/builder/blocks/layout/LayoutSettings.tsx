/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
/**
 * external dependencies
 */
import React from 'react';

/**
 * internal dependencies
 */
import { PaddingControl, ColorPickerControl } from '../basic/shared';
import { BackgroundImageSection } from './components/BackgroundImageSection';
import ConditionalSectionGate from '@/builder/components/ConditionalSectionGate';
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
			return sectionId
				? sections.find((s: any) => s.id === sectionId)
				: null;
		},
		[sectionId]
	);

	const hasConditions = section?.conditions && section.conditions.length > 0;

	// Check if Pro is active for conditional sections
	const isProActive = applyFilters(
		'doublescale_is_pro_active',
		false
	) as boolean;

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
				label={__('Background Color', 'doublescale')}
				id="layout-bg-color"
			/>

			<PaddingControl
				value={settings.padding}
				onChange={handlePaddingChange}
			/>

			{/* Conditional Section Button - Pro Feature */}
			{sectionId && (
				<div className="border-t pt-4">
					<Button
						variant={hasConditions ? 'default' : 'outline'}
						className="w-full"
						onClick={() => setShowConditionsModal(true)}
					>
						<Filter className="w-4 h-4 mr-2" />
						{hasConditions
							? __('Edit Conditions', 'doublescale')
							: __('Add Conditions', 'doublescale')}
						{!isProActive && (
							<span className="ml-2 text-xs text-blue-600">
								({__('Pro', 'doublescale')})
							</span>
						)}
					</Button>
					{hasConditions && (
						<p className="text-xs text-gray-600 mt-2 text-center">
							{__(
								'This section has conditional rendering',
								'doublescale'
							)}
						</p>
					)}
				</div>
			)}

			{/* Conditional Section Modal - Gated by Pro */}
			{sectionId && (
				<ConditionalSectionGate
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
