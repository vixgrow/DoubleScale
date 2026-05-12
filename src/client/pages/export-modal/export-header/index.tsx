/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { DialogTitle, DialogHeader } from '@/components/ui/dialog';

const ExportHeader: React.FC = () => {
	return (
		<DialogHeader className='px-16 pb-4'>
			<DialogTitle>
				<h1 className="text-3xl font-normal text-[#09090B]">
					{__('Export Contacts', 'doublescale')}
				</h1>
			</DialogTitle>
		</DialogHeader>
	);
};

export default ExportHeader;
