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
			<DialogContent className=" w-7xl max-w-[90vw] max-h-[90vh] p-6 overflow-y-auto">
				{/* Content */}
				<div className=" max-h-[calc(90vh-80px)] p-6">
					<SalesRepDetailView ownerId={ownerId} />
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SalesRepModal;
