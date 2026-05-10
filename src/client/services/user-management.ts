/**
 * User Management API Service
 * Connects frontend to backend user role management endpoints
 */

import apiFetch from '@wordpress/api-fetch';
import { ManagerRole } from '../pages/settings/team/components/types';

export interface CRMUser {
    id: number;
    name: string;
    email: string;
    user_login: string;
    role: string;
    crm_role: ManagerRole;
    roles: ManagerRole[];
}

export interface AddUserRequest {
    email: string;
    roles: ManagerRole[];
}

export interface UpdateUserRoleRequest {
    role: ManagerRole;
}

/**
 * User Management API Service
 */
export class UserManagementAPI {
    private static baseUrl = '/doublescale/v1/user-management';

    /**
     * Get all CRM users
     */
    static async getCRMUsers(): Promise<CRMUser[]> {
        try {
            const response = await apiFetch({
                path: `${this.baseUrl}/users`,
                method: 'GET',
            });
            return response as CRMUser[];
        } catch (error) {
            console.error('Error fetching CRM users:', error);
            throw error;
        }
    }

    /**
     * Add user by email and assign role
     */
    static async addUserByEmail(data: AddUserRequest): Promise<{
        success: boolean;
        message: string;
        user: CRMUser;
    }> {
        try {
            const response = await apiFetch({
                path: `${this.baseUrl}/users`,
                method: 'POST',
                data,
            });
            return response as {
                success: boolean;
                message: string;
                user: CRMUser;
            };
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    }

    /**
     * Update user role
     */
    static async updateUserRole(
        userId: number,
        data: UpdateUserRoleRequest
    ): Promise<{
        success: boolean;
        message: string;
        user: { id: number; crm_role: ManagerRole };
    }> {
        try {
            const response = await apiFetch({
                path: `${this.baseUrl}/users/${userId}/role`,
                method: 'PUT',
                data,
            });
            return response as {
                success: boolean;
                message: string;
                user: { id: number; crm_role: ManagerRole };
            };
        } catch (error) {
            console.error('Error updating user role:', error);
            throw error;
        }
    }

    /**
     * Remove user CRM access
     */
    static async removeUserCRMAccess(userId: number): Promise<{
        success: boolean;
        message: string;
    }> {
        try {
            const response = await apiFetch({
                path: `${this.baseUrl}/users/${userId}`,
                method: 'DELETE',
            });
            return response as {
                success: boolean;
                message: string;
            };
        } catch (error) {
            console.error('Error removing user CRM access:', error);
            throw error;
        }
    }

    /**
     * Get assignable users for deals
     */
    static async getAssignableUsers(): Promise<{
        id: number;
        display_name: string;
        user_email: string;
    }[]> {
        try {
            const response = await apiFetch({
                path: `${this.baseUrl}/assignable-users`,
                method: 'GET',
            });
            return response as {
                id: number;
                display_name: string;
                user_email: string;
            }[];
        } catch (error) {
            console.error('Error fetching assignable users:', error);
            throw error;
        }
    }
}

export default UserManagementAPI;
