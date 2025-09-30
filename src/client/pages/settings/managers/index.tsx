import React, { useState } from 'react';
import { Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import { __ } from '@wordpress/i18n';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import DataTablePagination from '@/components/ui/data-table-pagination';
import AddNewManager from './components/add-new-manager';
import EditManager from './components/edit-manager';
import { useUserManagement } from '../../../hooks/use-user-management';
import { CRMUser } from '../../../services/user-management';
import { ManagerRole, ManagerRoleLabels } from './components/types';

const Managers: React.FC = () => {
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [managerToDelete, setManagerToDelete] = useState<number | null>(null);
	const [managerToEdit, setManagerToEdit] = useState<CRMUser | null>(null);
	const {
		users: managers,
		isLoading,
		isAdding,
		isUpdating,
		isDeleting,
		addUser,
		updateUserRole,
		removeUser,
	} = useUserManagement();

	const handleAddManager = () => {
		setIsAddModalOpen(true);
	};

	const handleAddManagerSuccess = async (data: {
		email: string;
		roles: ManagerRole[];
	}) => {
		const result = await addUser(data);
		if (result) {
			setIsAddModalOpen(false);
		} else {
			// Throw error so the child component knows it failed
			throw new Error('Failed to add user');
		}
	};

	const handleEditManager = (managerId: number) => {
		const manager = managers.find((m) => m.id === managerId);
		if (manager) {
			setManagerToEdit(manager);
			setIsEditModalOpen(true);
		}
	};

	const handleEditManagerSuccess = async (
		managerId: number,
		role: ManagerRole
	) => {
		const result = await updateUserRole(managerId, role);
		if (result) {
			setIsEditModalOpen(false);
			setManagerToEdit(null);
		} else {
			// Throw error so the child component knows it failed
			throw new Error(__('Failed to update user role', 'quillcrm'));
		}
	};

	const handleDeleteManager = (managerId: number) => {
		setManagerToDelete(managerId);
		setDeleteConfirmOpen(true);
	};

	const confirmDeleteManager = async () => {
		if (managerToDelete) {
			await removeUser(managerToDelete);
			setDeleteConfirmOpen(false);
			setManagerToDelete(null);
		}
	};

	// Mock table object for pagination
	const mockTable = {
		getState: () => ({
			pagination: {
				pageIndex: 0,
				pageSize: 10,
			},
		}),
		getPageCount: () => 1,
		getFilteredSelectedRowModel: () => ({ rows: [] }),
		getFilteredRowModel: () => ({ rows: managers }),
		setPageSize: (size: number) => console.log('Set page size:', size),
		setPageIndex: (index: number) => console.log('Set page index:', index),
		getCanPreviousPage: () => false,
		getCanNextPage: () => false,
		previousPage: () => console.log('Previous page'),
		nextPage: () => console.log('Next page'),
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#1E3A8A] mb-2">
						{__('CRM Managers', 'quillcrm')}
					</h1>
					<p className="text-sm text-gray-600">
						{__(
							'All WordPress Administrators automatically get full access to QuillCRM',
							'quillcrm'
						)}
					</p>
				</div>
				<Button
					onClick={handleAddManager}
					disabled={isAdding}
					className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6"
				>
					{isAdding ? (
						<Loader2 className="w-4 h-4 mr-2 animate-spin" />
					) : (
						<Plus className="w-4 h-4 mr-2" />
					)}
					{__('Add New Manager', 'quillcrm')}
				</Button>
			</div>

			{/* Table */}
			<div className="border rounded-lg">
				{isLoading ? (
					<div className="flex items-center justify-center p-8">
						<Loader2 className="w-6 h-6 animate-spin mr-2" />
						{__('Loading CRM users...', 'quillcrm')}
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="font-semibold text-gray-700">
									ID
								</TableHead>
								<TableHead className="font-semibold text-gray-700">
									Name
								</TableHead>
								<TableHead className="font-semibold text-gray-700">
									Email
								</TableHead>
								<TableHead className="font-semibold text-gray-700">
									Role
								</TableHead>
								<TableHead className="font-semibold text-gray-700">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{managers.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-center py-8 text-gray-500"
									>
										{__(
											'No CRM users found. Add your first manager above.',
											'quillcrm'
										)}
									</TableCell>
								</TableRow>
							) : (
								managers.map((manager) => (
									<TableRow key={manager.id}>
										<TableCell className="font-medium">
											{manager.id}
										</TableCell>
										<TableCell>{manager.name}</TableCell>
										<TableCell>{manager.email}</TableCell>
										<TableCell>
											<Badge
												variant="secondary"
												className={`text-xs ${
													manager.crm_role ===
													'quillcrm_crm_manager'
														? 'bg-blue-100 text-blue-700'
														: 'bg-green-100 text-green-700'
												}`}
											>
												{
													ManagerRoleLabels[
														manager.crm_role
													]
												}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														handleEditManager(
															manager.id
														)
													}
													disabled={isUpdating}
													className="text-blue-600 border-blue-200 hover:bg-blue-50"
													title={__(
														'Edit role',
														'quillcrm'
													)}
												>
													{isUpdating ? (
														<Loader2 className="w-4 h-4 animate-spin" />
													) : (
														<Edit className="w-4 h-4" />
													)}
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														handleDeleteManager(
															manager.id
														)
													}
													disabled={isDeleting}
													className="text-red-600 border-red-200 hover:bg-red-50"
													title={__(
														'Remove CRM access',
														'quillcrm'
													)}
												>
													{isDeleting ? (
														<Loader2 className="w-4 h-4 animate-spin" />
													) : (
														<Trash2 className="w-4 h-4" />
													)}
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				)}

				{/* Pagination */}
				<DataTablePagination table={mockTable} />
			</div>

			{/* Add New Manager Modal */}
			<AddNewManager
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSuccess={handleAddManagerSuccess}
			/>

			{/* Edit Manager Modal */}
			<EditManager
				isOpen={isEditModalOpen}
				onClose={() => {
					setIsEditModalOpen(false);
					setManagerToEdit(null);
				}}
				onSuccess={handleEditManagerSuccess}
				manager={managerToEdit}
			/>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={deleteConfirmOpen}
				onOpenChange={setDeleteConfirmOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{__('Remove CRM Access', 'quillcrm')}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{__(
								"Are you sure you want to remove this user's CRM access? This action cannot be undone.",
								'quillcrm'
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							onClick={() => setDeleteConfirmOpen(false)}
						>
							{__('Cancel', 'quillcrm')}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDeleteManager}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							{__('Remove Access', 'quillcrm')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default Managers;
