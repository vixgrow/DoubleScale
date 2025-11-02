import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MyTemplatesIcon } from '@/components/icons';

interface MyTemplatesPanelProps {
	isOpen: boolean;
	onClose: () => void;
}

const MyTemplatesContent = () => {
	return (
		<div className="flex flex-col items-center justify-center h-full">
			<div className="mb-2">
				<div className="flex items-center justify-center mb-4 text-gray">
					<MyTemplatesIcon width={55} height={55} />
				</div>
			</div>
			<p className="text-gray-500 text-center">
				{__('No saved templates til now', 'quillcrm')}
			</p>
		</div>
	);
};

const MyTemplatesPanel = ({ isOpen, onClose }: MyTemplatesPanelProps) => {
	if (!isOpen) return null;

	return (
		<div className="absolute top-0 left-0 w-full h-full bg-white z-30">
			<div className="flex flex-col h-full">
				<div className="flex items-center justify-between p-6 border-b border-gray-200 mx-2">
					<h2 className="text-lg font-semibold text-gray-900">
						{__('Pre-built Templates', 'quillcrm')}
					</h2>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="h-8 w-8 p-0 hover:bg-gray-100"
					>
						<X className="h-5 w-5" />
					</Button>
				</div>
				<div className="flex-1 overflow-y-auto">
					<MyTemplatesContent />
				</div>
			</div>
		</div>
	);
};

export default MyTemplatesPanel;
