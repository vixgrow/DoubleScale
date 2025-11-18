import EditPipelineIcon from "@quillcrm/components/icons/edit-pipeline";
import { PipelineModal } from "../pipeline-Model";
import { __ } from '@wordpress/i18n';

export const EditPipelineModal = ({
	
	visible,
	onClose,
	onSuccess,
	pipeline,
}) => {
	
	return (
		<PipelineModal
			visible={visible}
			onClose={onClose}
			onSuccess={onSuccess}
			mode="edit"
			title={__('Edit Pipeline', 'quillcrm')}
			subtitle=""
			icon={<EditPipelineIcon />}
			pipeline={pipeline}
		/>
	);
};