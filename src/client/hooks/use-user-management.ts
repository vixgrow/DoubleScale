/**
 * React hook for user management operations
 */

import { useState, useEffect } from 'react';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import UserManagementAPI, { CRMUser, AddUserRequest } from '../services/user-management';
import { ManagerRole, ManagerRoleLabels } from '../pages/settings/managers/components/types';

interface UseUserManagementReturn {
    users: CRMUser[];
    isLoading: boolean;
    isAdding: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    refreshUsers: () => Promise<void>;
    addUser: (data: AddUserRequest) => Promise<CRMUser | null>;
    updateUserRole: (userId: number, role: ManagerRole) => Promise<boolean>;
    removeUser: (userId: number) => Promise<boolean>;
}

export const useUserManagement = (): UseUserManagementReturn => {
    const [users, setUsers] = useState<CRMUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const { createNotice } = useDispatch('quillcrm/core');

    /**
     * Fetch all CRM users
     */
    const refreshUsers = async () => {
        setIsLoading(true);
        try {
            const fetchedUsers = await UserManagementAPI.getCRMUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            createNotice({
                type: 'error',
                message: __('Failed to fetch CRM users', 'quillcrm'),
            });
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Add new user with CRM role
     */
    const addUser = async (data: AddUserRequest): Promise<CRMUser | null> => {
        setIsAdding(true);
        try {
            const response = await UserManagementAPI.addUserByEmail(data);

            if (response.success) {
                createNotice({
                    type: 'success',
                    message: response.message || __('User added successfully', 'quillcrm'),
                });

                // Add user to local state
                setUsers(prev => [...prev, response.user]);
                return response.user;
            } else {
                throw new Error(response.message);
            }
        } catch (error: any) {
            // Extract error message from WordPress REST API error format
            let errorMessage = __('Failed to add user', 'quillcrm');

            if (error?.data?.message) {
                errorMessage = error.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            createNotice({
                type: 'error',
                message: errorMessage,
            });
            return null;
        } finally {
            setIsAdding(false);
        }
    };

    /**
     * Update user role
     */
    const updateUserRole = async (
        userId: number,
        role: ManagerRole
    ): Promise<boolean> => {
        setIsUpdating(true);
        try {
            const response = await UserManagementAPI.updateUserRole(userId, { role });

            if (response.success) {
                createNotice({
                    type: 'success',
                    message: response.message || __('User role updated successfully', 'quillcrm'),
                });

                // Update user in local state
                setUsers(prev => prev.map(user => {
                    if (user.id === userId) {
                        return {
                            ...user,
                            crm_role: response.user.crm_role,
                            role: ManagerRoleLabels[response.user.crm_role]
                        };
                    }
                    return user;
                }));

                return true;
            } else {
                throw new Error(response.message);
            }
        } catch (error: any) {
            createNotice({
                type: 'error',
                message: error?.message || __('Failed to update user role', 'quillcrm'),
            });
            return false;
        } finally {
            setIsUpdating(false);
        }
    };

    /**
     * Remove user CRM access
     */
    const removeUser = async (userId: number): Promise<boolean> => {
        setIsDeleting(true);
        try {
            const response = await UserManagementAPI.removeUserCRMAccess(userId);

            if (response.success) {
                createNotice({
                    type: 'success',
                    message: response.message || __('User CRM access removed successfully', 'quillcrm'),
                });

                // Remove user from local state
                setUsers(prev => prev.filter(user => user.id !== userId));
                return true;
            } else {
                throw new Error(response.message);
            }
        } catch (error: any) {
            createNotice({
                type: 'error',
                message: error?.message || __('Failed to remove user', 'quillcrm'),
            });
            return false;
        } finally {
            setIsDeleting(false);
        }
    };

    // Load users on mount
    useEffect(() => {
        refreshUsers();
    }, []);

    return {
        users,
        isLoading,
        isAdding,
        isUpdating,
        isDeleting,
        refreshUsers,
        addUser,
        updateUserRole,
        removeUser,
    };
};

export default useUserManagement;
