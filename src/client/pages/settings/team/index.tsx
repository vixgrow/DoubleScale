import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { __ } from '@wordpress/i18n';

import { Button } from '@/components/ui/button';
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
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import AddNewManager from './components/add-new-manager';
import EditManager from './components/edit-manager';
import { useUserManagement } from '../../../hooks/use-user-management';
import { CRMUser } from '../../../services/user-management';
import { ManagerRole } from './components/types';
import { getManagerColumns } from './columns';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { ColoredDeleteIcon } from '@doublescale/components';

const Managers: React.FC = () => {
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [managerToDelete, setManagerToDelete] = useState<number | null>(null);
	const [managerToEdit, setManagerToEdit] = useState<CRMUser | null>(null);
	const [page, setPage] = useState<number>(1);
	const [perPage, setPerPage] = useState<number>(10);
	const [totalRecords, setTotalRecords] = useState<number>(0);
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

	// Keep total count in sync
	React.useEffect(() => {
		setTotalRecords(managers.length);
	}, [managers]);

	// Server-like pagination hook (UI-only for now)
	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	// Slice managers for current page (client-side emulation)
	const pagedManagers = React.useMemo(() => {
		const start = (page - 1) * perPage;
		const end = start + perPage;
		return managers.slice(start, end);
	}, [managers, page, perPage]);

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
			throw new Error(__('Failed to update user role', 'doublescale'));
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

	// Columns for DataTable
	const columns = getManagerColumns({
		onEdit: handleEditManager,
		onDelete: handleDeleteManager,
		isUpdating,
		isDeleting,
	});

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground tracking-tight">
						{__('CRM Managers', 'doublescale')}
					</h1>
					<p className="text-sm text-muted-foreground">
						{__(
							'All WordPress Administrators automatically get full access to DoubleScale',
							'doublescale'
						)}
					</p>
				</div>
				<Button
					onClick={handleAddManager}
					disabled={isAdding}
				>
					{isAdding ? (
						<Loader2 className="w-4 h-4 mr-2 animate-spin" />
					) : (
						<Plus className="w-4 h-4 mr-2" />
					)}
					{__('Add New Manager', 'doublescale')}
				</Button>
			</div>

			{/* Table */}
			<div className="">
				<DataTable
					columns={columns}
					data={pagedManagers}
					showMainActions={false}
					config={{}}
					showPagination={false}
					initialPageSize={perPage}
					setPage={setPage}
					loading={isLoading}
				/>
				<DataTablePagination table={serverSideTable} />
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
				<AlertDialogContent className="max-w-[38rem] p-8 z-[150200]">
					<AlertDialogHeader>
						<div className="flex flex-col items-center justify-center gap-6">
							<div className="flex items-center justify-center rounded-3xl p-5 bg-[#FCDADA] text-[#EF4444]">
								<ColoredDeleteIcon />
							</div>
							<AlertDialogTitle className="text-2xl font-bold text-[#09090B] text-center">
								{__('Remove CRM Access', 'doublescale')}
							</AlertDialogTitle>
							<AlertDialogDescription className="text-center text-[#6B7280]">
								{__(
									"Are you sure you want to remove this user's CRM access? This action cannot be undone.",
									'doublescale'
								)}
							</AlertDialogDescription>
						</div>
					</AlertDialogHeader>
					<AlertDialogFooter className="flex gap-2 mt-4">
						<AlertDialogCancel
							onClick={() => setDeleteConfirmOpen(false)}
							className="flex-1"
						>
							{__('Back', 'doublescale')}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDeleteManager}
							className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
						>
							{__('Yes, Remove', 'doublescale')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default Managers;
