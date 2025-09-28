// Import the detailed sales rep view component
import SalesRepDetailView from '../sale-rep';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

import { __ } from '@wordpress/i18n';

const SalesRepModal = ({
	isOpen,
	onClose,
	ownerId,
}: {
	isOpen: boolean;
	onClose: () => void;
	ownerId: number | null;
}) => {
	if (!ownerId) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0">
				<DialogHeader className="p-6 border-b border-gray-200">
					<DialogTitle className="text-xl font-semibold text-gray-900">
						{__('Sales Representative Details', 'quillcrm')}
					</DialogTitle>
				</DialogHeader>

				{/* Content */}
				<div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
					<SalesRepDetailView ownerId={ownerId} />
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SalesRepModal;
