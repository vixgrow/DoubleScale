// /**
//  * WordPress dependencies
//  */
import { __ } from '@wordpress/i18n';


import { PipelineModal } from '../pipeline-Model';
import CreatePipelineIcon from '@quillcrm/components/icons/create-pipeline';



export const NewPipelineModal = ({ visible, onClose, onSuccess }) => {
	// const handleSuccess = (newPipeline) => {
	// 	onSuccess(newPipeline); 
	// };
	
	return (
		<PipelineModal
			visible={visible}
			onClose={onClose}
			onSuccess={onSuccess}
			mode="create"
			title={__('Create New Pipeline', 'quillcrm')}
			subtitle={__(
				'Add basic information below to create new pipeline',
				'quillcrm'
			)}
			icon={<CreatePipelineIcon />}
			// pipeline={pipeline}
		/>
	);
};
