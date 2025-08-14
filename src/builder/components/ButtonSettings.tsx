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

type ButtonType = 'primary' | 'secondary' | 'tertiary';

const ButtonSettings: React.FC<{
	onBack: () => void;
}> = ({ onBack }) => {
	const [selectedButton, setSelectedButton] = useState<ButtonType | null>(
		null
	);

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
						<div className="bg-primary text-white py-2 px-4 rounded-md text-xs">
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
						<div className="border border-primary text-primary py-2 px-4 rounded-md text-xs">
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
						<div className="bg-white text-primary py-2 px-4 text-xs">
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
