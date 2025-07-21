/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

const ExportHeader: React.FC = () => {
	return (
		<div className="flex items-center justify-between">
			<h1 className="text-3xl font-normal text-[#09090B]">
				{__('Export Contacts', 'quillcrm')}
			</h1>
		</div>
	);
};

export default ExportHeader;
