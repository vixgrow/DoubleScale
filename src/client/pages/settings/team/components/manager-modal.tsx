import React, { useState, useEffect, useCallback } from 'react';
import { __, sprintf } from '@wordpress/i18n';

import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CRMUser } from '@doublescale/services/user-management';
import Config from '@doublescale/config';
import { useModulesEnabled } from '@doublescale/hooks/use-module-enabled';
import { isProActive } from '@doublescale/hooks/use-is-pro-active';
import {
	ManagerRole,
	ManagerRoleDescriptions,
	ManagerRoleModuleRequirements,
	ManagerRoleOptions,
	ManagerRoleProRequirements,
} from './types';
import {
	CustomDialogHeader,
	GradientAddContactIcon,
} from '@doublescale/components';
import { InfiniteScrollSelect } from '@/components/infinite-scroll-select';

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

interface WordPressUser {
	id: number;
	name: string;
	display_name: string;
	email: string;
	username: string;
}

const ManagerModal: React.FC<ManagerModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	mode,
	manager,
}) => {
	const [email, setEmail] = useState('');
	const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
	const [selectedUser, setSelectedUser] = useState<WordPressUser | null>(
		null
	);
	const [selectedRoles, setSelectedRoles] = useState<ManagerRole[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string>('');

	const availableRoles = ManagerRoleOptions;
	const moduleFlags = useModulesEnabled( [ 'support', 'deals', 'booking', 'projects' ] );
	const isProActiveFlag = isProActive();

	const getModuleLabel = useCallback( ( slug: string ) => {
		return (
			Config.getModules().find( ( mod ) => mod.slug === slug )?.label ??
			slug
		);
	}, [] );

	const isRoleAssignable = useCallback(
		( roleId: ManagerRole ) => {
			if (
				ManagerRoleProRequirements.includes( roleId ) &&
				! isProActiveFlag
			) {
				return false;
			}

			const moduleSlug = ManagerRoleModuleRequirements[ roleId ];
			if ( ! moduleSlug ) {
				return true;
			}

			return moduleFlags[ moduleSlug ] ?? false;
		},
		[ isProActiveFlag, moduleFlags ]
	);

	const isEditMode = mode === 'edit';

	// Set initial values when manager changes or modal opens
	useEffect(() => {
		if (isEditMode && manager) {
			setEmail(manager.email);
			setSelectedUserId(manager.id);
			setSelectedUser({
				id: manager.id,
				name: manager.name,
				display_name: manager.name,
				email: manager.email,
				username: manager.user_login || '',
			});
			// Prefill with every CRM role the user currently holds. Fall back to
			// the single effective `crm_role` for rows that predate multi-role.
			const existing =
				Array.isArray(manager.roles) && manager.roles.length > 0
					? manager.roles
					: manager.crm_role
						? [manager.crm_role]
						: [];
			setSelectedRoles(existing);
		} else if (!isEditMode) {
			// Reset for add mode
			setEmail('');
			setSelectedUserId(null);
			setSelectedUser(null);
			setSelectedRoles([]);
		}
	}, [manager, mode, isEditMode]);

	const handleRoleToggle = (roleId: ManagerRole, checked: boolean) => {
		if ( checked && ! isRoleAssignable( roleId ) ) {
			return;
		}

		setSelectedRoles( ( prev ) =>
			checked
				? prev.includes( roleId )
					? prev
					: [ ...prev, roleId ]
				: prev.filter( ( r ) => r !== roleId )
		);
		if ( error ) {
			setError( '' );
		}
	};

	const handleUserChange = (
		userId: number | string,
		user?: WordPressUser
	) => {
		const numericId = Number(userId);
		setSelectedUserId(numericId);
		if (user) {
			setSelectedUser(user);
			setEmail(user.email); // Set email for submission
		}
		if (error) setError(''); // Clear error when user changes selection
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// For add mode, require user selection
		if (!isEditMode && !selectedUserId) {
			setError(__('Please select a user', 'doublescale'));
			return;
		}

		if (selectedRoles.length === 0) {
			setError(__('Please select at least one role', 'doublescale'));
			return;
		}

		if (isEditMode && !manager) return;

		setIsSubmitting(true);
		setError(''); // Clear any previous errors

		try {
			// For add mode, use the email from selected user
			const emailToSubmit = isEditMode
				? email
				: selectedUser?.email || email;

			const formData: ManagerFormData = {
				email: emailToSubmit,
				roles: selectedRoles,
			};

			if (isEditMode && manager) {
				formData.managerId = manager.id;
			}

			await onSuccess(formData);

			// Reset form only in add mode (edit mode parent will close modal)
			if (!isEditMode) {
				setEmail('');
				setSelectedUserId(null);
				setSelectedUser(null);
				setSelectedRoles([]);
			}
		} catch (error: any) {
			console.error(
				`Error ${isEditMode ? 'updating' : 'adding'} manager:`,
				error
			);
			const defaultMessage = isEditMode
				? __(
						'Failed to update manager role. Please try again.',
						'doublescale'
					)
				: __('Failed to add manager. Please try again.', 'doublescale');

			setError(error?.message || defaultMessage);
			// Don't close the modal on error so user can retry
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		setEmail('');
		setSelectedUserId(null);
		setSelectedUser(null);
		setSelectedRoles([]);
		setError('');
		onClose();
	};

	const getTitle = () => {
		return isEditMode
			? __('Edit Manager Role', 'doublescale')
			: __('Add new Manager', 'doublescale');
	};

	const getSubtitle = () => {
		return isEditMode
			? __('Update the manager role information below.', 'doublescale')
			: __('Add basic information below to add new Manager.', 'doublescale');
	};

	const getSubmitButtonText = () => {
		if (isSubmitting) {
			return isEditMode
				? __('Updating...', 'doublescale')
				: __('Adding...', 'doublescale');
		}
		return isEditMode
			? __('Update Role', 'doublescale')
			: __('Add Manager', 'doublescale');
	};

	const getUserHelperText = () => {
		return isEditMode
			? __('User cannot be changed', 'doublescale')
			: __('Please select an existing WordPress user', 'doublescale');
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="flex max-h-[min(90vh,720px)] max-w-lg flex-col overflow-hidden p-0">
				<DialogHeader className="shrink-0 border-b border-border/60 p-6 pb-4">
					<CustomDialogHeader
						title={getTitle()}
						subtitle={getSubtitle()}
						icon={<GradientAddContactIcon />}
					/>
				</DialogHeader>

				<form
					onSubmit={handleSubmit}
					className="flex min-h-0 flex-1 flex-col"
				>
					<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
						{error && (
							<div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
								<p className="text-sm text-red-600">{error}</p>
							</div>
						)}

						<div className="mb-6">
							<label className="mb-2 block text-base font-normal text-foreground">
								{__('Select User', 'doublescale')}
								{!isEditMode && (
									<span className="ml-1 text-red-500">*</span>
								)}
							</label>
							{isEditMode ? (
								<>
									<div className="flex h-12 w-full items-center rounded-lg border border-border/60 bg-gray-50 px-4 py-[5px] text-sm text-foreground">
										{email}
									</div>
									<p className="mt-1 text-xs text-gray-500">
										{getUserHelperText()}
									</p>
								</>
							) : (
								<>
									<InfiniteScrollSelect
										value={selectedUserId || ''}
										onValueChange={handleUserChange}
										placeholder={__(
											'Select a WordPress user',
											'doublescale'
										)}
										apiEndpoint="/doublescale/v1/user-management/users/frontend"
										searchParamName="search"
										getOptionLabel={(user: WordPressUser) =>
											`${user.display_name} (${user.email})`
										}
										getOptionValue={(user: WordPressUser) =>
											user.id
										}
										dataPath="users"
										totalPath="pagination.total"
										perPage={20}
										selectedItem={selectedUser}
									/>
									<p className="mt-1 text-xs text-gray-500">
										{getUserHelperText()}
									</p>
								</>
							)}
						</div>

						<div>
							<div className="text-base font-normal text-foreground">
								{__('Roles', 'doublescale')}
							</div>
							<p className="mb-2 text-xs text-gray-500">
								{__(
									'Select one or more roles. Capabilities merge across every assigned role.',
									'doublescale'
								)}
							</p>

							<div className="space-y-3">
								{availableRoles.map((role) => {
									const moduleSlug =
										ManagerRoleModuleRequirements[role.id];
									const requiresPro =
										ManagerRoleProRequirements.includes(
											role.id
										);
									const roleAssignable = isRoleAssignable(
										role.id
									);
									const isAssigned = selectedRoles.includes(
										role.id
									);
									const checkboxDisabled =
										!roleAssignable && !isAssigned;

									return (
										<div key={role.id} className="space-y-1">
											<div className="flex items-start space-x-3">
												<Checkbox
													id={role.id}
													checked={isAssigned}
													disabled={checkboxDisabled}
													onCheckedChange={(checked) =>
														handleRoleToggle(
															role.id,
															checked === true
														)
													}
													className="mt-0.5 h-5 w-5"
												/>
												<div className="min-w-0 flex-1">
													<Label
														htmlFor={role.id}
														className={
															checkboxDisabled
																? 'cursor-not-allowed text-sm font-medium text-gray-400'
																: 'cursor-pointer text-sm font-medium text-gray-700'
														}
													>
														{__(role.label, 'doublescale')}
													</Label>
													<p
														className={
															checkboxDisabled
																? 'mt-0.5 text-xs leading-relaxed text-gray-400'
																: 'mt-0.5 text-xs leading-relaxed text-gray-500'
														}
													>
														{__(
															ManagerRoleDescriptions[role.id],
															'doublescale'
														)}
													</p>
												</div>
											</div>
											{requiresPro && !isProActiveFlag && (
												<p className="pl-8 text-xs text-amber-700">
													{__(
														'Activate DoubleScale Pro to assign this role.',
														'doublescale'
													)}
												</p>
											)}
											{roleAssignable === false &&
												moduleSlug &&
												(requiresPro
													? isProActiveFlag
													: true) && (
													<p className="pl-8 text-xs text-amber-700">
														{sprintf(
															/* translators: %s: module label from Settings → Modules */
															__(
																'Enable the %s module in Settings → Modules to assign this role.',
																'doublescale'
															),
															getModuleLabel(
																moduleSlug
															)
														)}
													</p>
												)}
										</div>
									);
								})}
							</div>
						</div>
					</div>

					<div className="shrink-0 border-t border-border/60 bg-background px-6 py-4">
						<Button
							variant="gradient"
							size="lg"
							type="submit"
							disabled={
								isEditMode
									? selectedRoles.length === 0 || isSubmitting
									: !selectedUserId ||
										selectedRoles.length === 0 ||
										isSubmitting
							}
							className="w-full"
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
