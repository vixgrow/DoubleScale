/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import ButtonEditor from './ButtonSettingsEditor';
import { useButtonSettings } from '../hooks/useButtonSettings';

type ButtonType = 'primary' | 'secondary' | 'tertiary';

const ButtonSettings: React.FC<{
	onBack: () => void;
}> = ({ onBack }) => {
	const [selectedButton, setSelectedButton] = useState<ButtonType | null>(
		null
	);
	const { getButtonSettings } = useButtonSettings();

	// Simple preview - just get the settings and apply basic styling
	const getPreview = (type: ButtonType) => {
		const s = getButtonSettings(type);
		return s
			? {
					padding: '6px 12px',
					fontSize: '12px',
					backgroundColor: s.backgroundColor,
					color: s.textColor,
					border: `${s.borderWidth}px solid ${s.borderColor}`,
					borderRadius: `${s.borderRadius}px`,
				}
			: {};
	};

	// If a button is selected, show the editor
	if (selectedButton) {
		return (
			<ButtonEditor
				buttonType={selectedButton}
				onBack={() => setSelectedButton(null)}
			/>
		);
	}

	// Otherwise show the button list
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
						{__('Buttons', 'quillcrm')}
					</h3>
				</div>
			</div>

			<div className="space-y-2 p-4">
				<div
					className="flex justify-between items-center border rounded-lg p-4 text-[#616161] text-base cursor-pointer hover:bg-gray-50"
					onClick={() => setSelectedButton('primary')}
				>
					<div className="flex items-center gap-[14px]">
						<div style={getPreview('primary')}>
							{__('Button', 'quillcrm')}
						</div>
						<div>{__('Primary button', 'quillcrm')}</div>
					</div>
					<ChevronRight />
				</div>
				<div
					className="flex justify-between items-center border rounded-lg p-4 text-[#616161] text-base cursor-pointer hover:bg-gray-50"
					onClick={() => setSelectedButton('secondary')}
				>
					<div className="flex items-center gap-[14px]">
						<div style={getPreview('secondary')}>
							{__('Button', 'quillcrm')}
						</div>
						<div>{__('Secondary button', 'quillcrm')}</div>
					</div>
					<ChevronRight />
				</div>
				<div
					className="flex justify-between items-center border rounded-lg p-4 text-[#616161] text-base cursor-pointer hover:bg-gray-50"
					onClick={() => setSelectedButton('tertiary')}
				>
					<div className="flex items-center gap-[14px]">
						<div style={getPreview('tertiary')}>
							{__('Button', 'quillcrm')}
						</div>
						<div>{__('Tertiary button', 'quillcrm')}</div>
					</div>
					<ChevronRight />
				</div>
			</div>
		</div>
	);
};

export default ButtonSettings;
