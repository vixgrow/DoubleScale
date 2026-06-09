import React from 'react';
import ManagerModal, { ManagerFormData } from './manager-modal';
import { CRMUser } from '@doublescale/services/user-management';
import { ManagerRole } from './types';

interface EditManagerProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (managerId: number, roles: ManagerRole[]) => Promise<void>;
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

		// Pass every selected role — a user can hold multiple CRM roles.
		await onSuccess(data.managerId, data.roles);
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
