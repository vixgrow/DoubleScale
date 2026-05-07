/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProFeatureNotice } from '@doublescale/components';

interface TasksProps {
	contact_id: number;
	navigate?: (path: string) => void;
}

const Tasks: React.FC<TasksProps> = ({ contact_id }) => {
	return (
		<ProFeatureNotice
			featureName={__('Tasks', 'doublescale')}
			description={__(
				'Track and manage tasks associated with this contact. View pending tasks, completed tasks, and overdue items.',
				'doublescale'
			)}
			features={[
				__('View all tasks for this contact', 'doublescale'),
				__('Track task status (pending, completed, overdue)', 'doublescale'),
				__('Filter by priority and task type', 'doublescale'),
				__('Create new tasks directly from contact page', 'doublescale'),
				__('View task due dates and assignments', 'doublescale'),
			]}
		/>
	);
};

export default Tasks;
