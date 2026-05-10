import React from 'react';
import ManagerModal, { ManagerFormData } from './manager-modal';
import { CRMUser } from '../../../../services/user-management';
import { ManagerRole } from './types';

interface EditManagerProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (managerId: number, role: ManagerRole) => Promise<void>;
	manager: CRMUser | null;
}

const EditManager: React.FC<EditManagerProps> = ({
	isOpen,
	onClose,
	onSuccess,
	manager,
}) => {
	const handleSuccess = async (data: ManagerFormData) => {
		if (!data.managerId) return;

		// Use the first role from the form data
		await onSuccess(data.managerId, data.roles[0]);
	};

	return (
		<ManagerModal
			isOpen={isOpen}
			onClose={onClose}
			onSuccess={handleSuccess}
			mode="edit"
			manager={manager}
		/>
	);
};

export default EditManager;
