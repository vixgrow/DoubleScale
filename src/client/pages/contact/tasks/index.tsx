/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProFeatureNotice } from '@quillcrm/components';

interface TasksProps {
	contact_id: number;
	navigate?: (path: string) => void;
}

const Tasks: React.FC<TasksProps> = ({ contact_id }) => {
	return (
		<ProFeatureNotice
			featureName={__('Tasks', 'quillcrm')}
			description={__(
				'Track and manage tasks associated with this contact. View pending tasks, completed tasks, and overdue items.',
				'quillcrm'
			)}
			features={[
				__('View all tasks for this contact', 'quillcrm'),
				__('Track task status (pending, completed, overdue)', 'quillcrm'),
				__('Filter by priority and task type', 'quillcrm'),
				__('Create new tasks directly from contact page', 'quillcrm'),
				__('View task due dates and assignments', 'quillcrm'),
			]}
		/>
	);
};

export default Tasks;
