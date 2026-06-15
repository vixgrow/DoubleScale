/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { ArrowLeft, ArrowRight } from 'lucide-react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { useExportContext } from '../contexts';

const ExportActions: React.FC = () => {
	const {
		loading,
		selectedFields,
		isFiltering,
		totalContact,
		handleClose,
		handleExport,
	} = useExportContext();

	return (
		<div className="lg:mt-8 mt-4 flex justify-between items-center">
			<Button
				variant="outline"
				onClick={handleClose}
				disabled={loading}
				className="flex items-center space-x-2 border-[#1E3A8A] bg-[#FAFAFA] text-[#1E3A8A]"
			>
				<ArrowLeft className="w-4 h-4" />
				{__('Cancel', 'doublescale')}
			</Button>
			<Button
				onClick={() => handleExport()}
				disabled={
					loading ||
					selectedFields.length === 0 ||
					isFiltering ||
					totalContact === 0
				}
			>
				{__('Export', 'doublescale')}
				<ArrowRight className="w-4 h-4" />
			</Button>
		</div>
	);
};

export default ExportActions;
