import React from 'react';
import ManagerModal, { ManagerFormData } from './manager-modal';
import { ManagerRole } from './types';

interface AddNewManagerProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (data: ManagerData) => Promise<void>;
}

interface ManagerData {
	email: string;
	roles: ManagerRole[];
}

const AddNewManager: React.FC<AddNewManagerProps> = ({
	isOpen,
	onClose,
	onSuccess,
}) => {
	const handleSuccess = async (data: ManagerFormData) => {
		// Convert ManagerFormData to ManagerData for compatibility
		await onSuccess({
			email: data.email,
			roles: data.roles,
		});
	};

	return (
		<ManagerModal
			isOpen={isOpen}
			onClose={onClose}
			onSuccess={handleSuccess}
			mode="add"
		/>
	);
};

export default AddNewManager;
