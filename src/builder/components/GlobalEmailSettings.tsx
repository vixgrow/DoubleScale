/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
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

interface GlobalEmailSettingsProps {
	onShowBackgroundSettings: () => void;
	onShowButtonSettings: () => void;
}

const GlobalEmailSettings: React.FC<GlobalEmailSettingsProps> = ({
	onShowBackgroundSettings,
	onShowButtonSettings,
}) => {
	const dispatch = useDispatch();
	const globalSettings = useSelect((select) => select(STORE_KEY).getGlobalSettings(), []);
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
					placeholder={__('650', 'quillcrm')}
					value={globalSettings.canvasWidth}
					onChange={(e) => dispatch(STORE_KEY).updateGlobalSettings({ canvasWidth: parseInt(e.target.value) || 600 })}
				/>
				<div className="text-[#616161] text-xs">
					{__('We recommend using a 600-700px width', 'quillcrm')}
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="text-[#333333]">
					{__('Theme Settings', 'quillcrm')}
				</div>
				<div
					className="flex justify-between items-center border rounded-lg p-4 text-[#616161] text-base cursor-pointer"
					onClick={onShowBackgroundSettings}
				>
					<div className="flex items-center gap-6">
						<ColorPaletteIcon />
						<div>{__('Background', 'quillcrm')}</div>
					</div>
					<ChevronRight />
				</div>
				<div
					className="flex justify-between items-center border rounded-lg p-4 text-[#616161] text-base cursor-pointer"
					onClick={onShowButtonSettings}
				>
					<div className="flex items-center gap-[14px]">
						<div className="border rounded-lg border-[#616161] p-1.5">
							<div className="border-t border-[#616161] w-[18px]"></div>
						</div>
						<div>{__('Buttons', 'quillcrm')}</div>
					</div>
					<ChevronRight />
				</div>
			</div>
		</div>
	);
};
export default GlobalEmailSettings;
