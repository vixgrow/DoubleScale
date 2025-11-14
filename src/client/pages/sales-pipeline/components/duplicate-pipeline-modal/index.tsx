// /**
//  * WordPress dependencies
//  */
import { __ } from '@wordpress/i18n';


import { PipelineModal } from "../pipeline-Model";
import DuplicatePipelineDialog from '@quillcrm/components/icons/duplicate-pipeline-modal';


export const DuplicatePipelineModal = ({ visible, onClose, onSuccess, pipeline }) => {
	return (
		<PipelineModal
			visible={visible}
			onClose={onClose}
			onSuccess={onSuccess}
			mode="duplicate"
			title={__('Duplicate Pipeline', 'quillcrm')}
			subtitle={''}
			icon={<DuplicatePipelineDialog />}
			pipeline={pipeline}
		/>
	);
};
