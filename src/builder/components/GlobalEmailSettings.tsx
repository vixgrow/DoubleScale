/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
/**
 * external dependencies
 */
import { ChevronRight } from 'lucide-react';
/**
 * internal dependencies
 */
import { Input } from '@/components/ui/input';
import { ColorPaletteIcon } from '@quillcrm/components';
import { STORE_KEY } from '../../stores/email-builder/constants';
import LockedButtons from './LockedButtons';

interface GlobalEmailSettingsProps {
	onShowBackgroundSettings: () => void;
	onShowButtonSettings: () => void;
}

const GlobalEmailSettings: React.FC<GlobalEmailSettingsProps> = ({
	onShowBackgroundSettings,
	onShowButtonSettings,
}) => {
	const dispatch = useDispatch();
	const globalSettings = useSelect(
		(select) => select(STORE_KEY).getGlobalSettings(),
		[]
	);

	// Apply filter to Buttons settings - Pro can override with clickable button
	const ButtonSettingsContent = applyFilters(
		'QuillCRM.Builder.ButtonSettings',
		LockedButtons,
		{ onShowButtonSettings }
	) as React.ComponentType<any>;

	return (
		<div className="grid gap-5">
			<div className="flex flex-col gap-2">
				<div className="text-[#333333]">
					{__('Canvas Width', 'quillcrm')}
				</div>
				<Input
					type="number"
					min={1}
					className="w-full h-12 rounded-lg"
					placeholder={__('700', 'quillcrm')}
					value={globalSettings.canvasWidth}
					onChange={(e) =>
						dispatch(STORE_KEY).updateGlobalSettings({
							canvasWidth: Number.parseInt(e.target.value) || 600,
						})
					}
				/>
				<div className="text-[#616161] text-xs">
					{__('We recommend using a 600-700px width', 'quillcrm')}
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="text-[#333333]">
					{__('Theme Settings', 'quillcrm')}
				</div>
				{/* Background - Always available */}
				<button
					type="button"
					className="flex justify-between items-center border rounded-lg p-4 text-[#616161] text-base cursor-pointer w-full hover:bg-gray-50 transition-colors"
					onClick={onShowBackgroundSettings}
				>
					<div className="flex items-center gap-6">
						<ColorPaletteIcon />
						<div>{__('Background', 'quillcrm')}</div>
					</div>
					<ChevronRight />
				</button>
				{/* Buttons - Locked by default, Pro can override */}
				<ButtonSettingsContent
					onShowButtonSettings={onShowButtonSettings}
				/>
			</div>
		</div>
	);
};
export default GlobalEmailSettings;
