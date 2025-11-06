import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CRMUser } from '../../../../services/user-management';
import { ManagerRole, ManagerRoleOptions } from './types';

interface ManagerModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (data: ManagerFormData) => Promise<void>;
	mode: 'add' | 'edit';
	manager?: CRMUser | null;
}

export interface ManagerFormData {
	email: string;
	roles: ManagerRole[];
	managerId?: number;
}

const ManagerModal: React.FC<ManagerModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	mode,
	manager,
}) => {
	const [email, setEmail] = useState('');
	const [selectedRole, setSelectedRole] = useState<ManagerRole | ''>('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string>('');

	const availableRoles = ManagerRoleOptions;

	const isEditMode = mode === 'edit';

	// Set initial values when manager changes or modal opens
	useEffect(() => {
		if (isEditMode && manager) {
			setEmail(manager.email);
			setSelectedRole(manager.crm_role);
		} else if (!isEditMode) {
			// Reset for add mode
			setEmail('');
			setSelectedRole('');
		}
	}, [manager, mode, isEditMode]);

	const handleRoleChange = (roleId: string) => {
		setSelectedRole(roleId as ManagerRole);
		if (error) setError(''); // Clear error when user changes role
	};

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEmail(e.target.value);
		if (error) setError(''); // Clear error when user types
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email || !selectedRole) return;
		if (isEditMode && !manager) return;

		setIsSubmitting(true);
		setError(''); // Clear any previous errors

		try {
			const formData: ManagerFormData = {
				email,
				roles: [selectedRole as ManagerRole],
			};

			if (isEditMode && manager) {
				formData.managerId = manager.id;
			}

			await onSuccess(formData);

			// Reset form only in add mode (edit mode parent will close modal)
			if (!isEditMode) {
				setEmail('');
				setSelectedRole('');
			}
		} catch (error: any) {
			console.error(
				`Error ${isEditMode ? 'updating' : 'adding'} manager:`,
				error
			);
			const defaultMessage = isEditMode
				? __(
						'Failed to update manager role. Please try again.',
						'quillcrm'
					)
				: __('Failed to add manager. Please try again.', 'quillcrm');

			setError(error?.message || defaultMessage);
			// Don't close the modal on error so user can retry
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		setEmail('');
		setSelectedRole('');
		setError('');
		onClose();
	};

	const getTitle = () => {
		return isEditMode
			? __('Edit Manager Role', 'quillcrm')
			: __('Add new Manager', 'quillcrm');
	};

	const getSubmitButtonText = () => {
		if (isSubmitting) {
			return isEditMode
				? __('Updating...', 'quillcrm')
				: __('Adding...', 'quillcrm');
		}
		return isEditMode
			? __('Update Role', 'quillcrm')
			: __('Add Manager', 'quillcrm');
	};

	const getEmailHelperText = () => {
		return isEditMode
			? __('Email address cannot be changed', 'quillcrm')
			: __(
					'Please Provide Email address of your existing system user',
					'quillcrm'
				);
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-md p-0">
				{/* Header */}
				<DialogHeader className="p-6 pb-4">
					<DialogTitle className="text-lg font-semibold text-gray-900">
						{getTitle()}
					</DialogTitle>
				</DialogHeader>

				{/* Content */}
				<form onSubmit={handleSubmit} className="px-6 pb-6">
					{/* Error Message */}
					{error && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
							<p className="text-sm text-red-600">{error}</p>
						</div>
					)}

					{/* User Email Section */}
					<div className="mb-6">
						<Label
							htmlFor="email"
							className="text-sm font-medium text-gray-700 mb-2 block"
						>
							{__('User Email', 'quillcrm')}
						</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={handleEmailChange}
							disabled={isEditMode}
							placeholder={
								!isEditMode
									? __('Type User Email Address', 'quillcrm')
									: undefined
							}
							className={`w-full h-12 px-4 border border-gray-300 rounded-md ${
								isEditMode
									? 'bg-gray-50 text-gray-500 cursor-not-allowed'
									: 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
							}`}
							required
						/>
						{!isEditMode && (
							<p className="text-sm text-gray-500 mt-2">
								{getEmailHelperText()}
							</p>
						)}
					</div>

					{/* Roles Section */}
					<div className="mb-6">
						<Label className="text-sm font-medium text-gray-700 mb-4 block">
							{isEditMode
								? __('Role', 'quillcrm')
								: __('Roles', 'quillcrm')}
						</Label>

						<RadioGroup
							value={selectedRole}
							onValueChange={handleRoleChange}
							className="space-y-4"
						>
							{availableRoles.map((role) => (
								<div
									key={role.id}
									className="flex items-center space-x-3"
								>
									<RadioGroupItem
										value={role.id}
										id={role.id}
										className="h-5 w-5"
									/>
									<Label
										htmlFor={role.id}
										className="text-sm font-normal text-gray-700 cursor-pointer"
									>
										{__(role.label, 'quillcrm')}
									</Label>
								</div>
							))}
						</RadioGroup>
					</div>

					{/* Action Buttons */}
					<div className="flex justify-end space-x-3 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={isSubmitting}
							className="px-6"
						>
							{__('Cancel', 'quillcrm')}
						</Button>
						<Button
							type="submit"
							disabled={!email || !selectedRole || isSubmitting}
							className="bg-blue-600 hover:bg-blue-700 text-white px-6"
						>
							{getSubmitButtonText()}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default ManagerModal;
