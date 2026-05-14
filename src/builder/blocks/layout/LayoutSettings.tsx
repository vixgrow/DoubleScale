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
import { STORE_KEY } from '@/stores/email-builder/constants';
import {
	useSectionSettings,
	LayoutSettingsData,
} from './hooks/useSectionSettings';
import { FiltersIcon } from '@doublescale/components';

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
					<button
						type="button"
						onClick={() => setShowConditionsModal(true)}
						className="relative mt-1 flex h-11 w-full items-center justify-center rounded-lg border-0 bg-transparent text-sm font-medium text-white/90 shadow-none transition-colors hover:bg-white/[0.06]"
					>
						<svg
							className="pointer-events-none absolute inset-0 z-0 h-full w-full rounded-lg text-white/45"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden
						>
							<rect
								x="0.5"
								y="0.5"
								width="calc(100% - 1px)"
								height="calc(100% - 1px)"
								rx="7"
								ry="7"
								fill="none"
								stroke="currentColor"
								strokeWidth="1"
								strokeDasharray="10 8"
								vectorEffect="nonScalingStroke"
							/>
						</svg>
						<span className="relative z-10 flex items-center justify-center gap-2">
							<FiltersIcon />
							{hasConditions
								? __('Edit Conditions', 'doublescale')
								: __('Add Conditions', 'doublescale')}
							{!isProActive && (
								<span className="text-xs text-white/55">
									({__('Pro', 'doublescale')})
								</span>
							)}
						</span>
					</button>
					{hasConditions && (
						<p className="mt-2 text-center text-xs text-white">
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
