/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { debounce } from 'lodash';

export interface User {
    id: number;
    display_name: string;
    email: string;
    name?: string;
    username?: string;
}

export interface UserSearchOptions {
    searchTerm?: string;
    perPage?: number;
    orderBy?: 'name' | 'email' | 'login';
    order?: 'asc' | 'desc';
    context?: 'edit' | 'view';
    minSearchLength?: number;
}

/**
 * Centralized User Service for managing WordPress users
 * Handles all user-related API operations with consistent formatting
 */
export class UserService {
    private static readonly DEFAULT_OPTIONS: Required<UserSearchOptions> = {
        searchTerm: '',
        perPage: 50,
        orderBy: 'name',
        order: 'asc',
        context: 'edit',
        minSearchLength: 2,
    };

    /**
     * Transform WordPress user format to our standardized format
     */
    private static transformUser(wpUser: any): User {
        return {
            id: parseInt(wpUser.id),
            display_name: wpUser.name || wpUser.username || `User ${wpUser.id}`,
            email: wpUser.email || '',
            name: wpUser.name,
            username: wpUser.username,
        };
    }

    /**
     * Transform array of WordPress users
     */
    private static transformUsers(wpUsers: any[]): User[] {
        return wpUsers
            .filter((user: any) => user && user.id)
            .map(this.transformUser);
    }

    /**
     * Build URL parameters for user search
     */
    private static buildSearchParams(options: UserSearchOptions): URLSearchParams {
        const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
        const params = new URLSearchParams();

        params.append('per_page', mergedOptions.perPage.toString());
        params.append('orderby', mergedOptions.orderBy);
        params.append('order', mergedOptions.order);
        params.append('context', mergedOptions.context);

        // Only add search term if it meets minimum length requirement
        if (
            mergedOptions.searchTerm &&
            mergedOptions.searchTerm.length >= mergedOptions.minSearchLength
        ) {
            params.append('search', mergedOptions.searchTerm);
        }

        return params;
    }

    /**
     * Build URL parameters for CRM user search
     */
    private static buildCRMSearchParams(options: UserSearchOptions): URLSearchParams {
        const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
        const params = new URLSearchParams();

        params.append('per_page', mergedOptions.perPage.toString());

        // Map orderby to CRM API fields
        let orderby = 'display_name';
        if (mergedOptions.orderBy === 'email') {
            orderby = 'user_email';
        } else if (mergedOptions.orderBy === 'login') {
            orderby = 'ID';
        }
        params.append('orderby', orderby);
        params.append('order', mergedOptions.order);

        // Only add search term if it meets minimum length requirement
        if (
            mergedOptions.searchTerm &&
            mergedOptions.searchTerm.length >= mergedOptions.minSearchLength
        ) {
            params.append('search', mergedOptions.searchTerm);
        }

        return params;
    }

    /**
     * Transform CRM API user format to our standardized format
     */
    private static transformCRMUser(crmUser: any): User {
        return {
            id: parseInt(crmUser.id),
            display_name: crmUser.display_name || crmUser.name || `User ${crmUser.id}`,
            email: crmUser.email || '',
            name: crmUser.name || crmUser.display_name,
            username: crmUser.username,
        };
    }

    /**
     * Transform array of CRM API users
     */
    private static transformCRMUsers(crmUsers: any[]): User[] {
        return crmUsers
            .filter((user: any) => user && user.id)
            .map(this.transformCRMUser);
    }

    /**
     * Fetch users from CRM API (filtered by CRM roles)
     */
    static async getUsers(options: UserSearchOptions = {}): Promise<User[]> {
        try {
            const params = this.buildCRMSearchParams(options);
            const response = await apiFetch({
                path: `/qc/v1/user-management/users/frontend?${params.toString()}`,
            });

            // CRM API returns paginated response with users array
            const apiResponse = response as any;
            const users = Array.isArray(apiResponse.users) ? apiResponse.users : [];
            return this.transformCRMUsers(users);
        } catch (error) {
            console.error('Failed to fetch CRM users:', error);
            // Fallback to WordPress API if CRM endpoint fails
            return this.getUsersFromWordPress(options);
        }
    }

    /**
     * Fallback method to fetch users from WordPress API
     */
    private static async getUsersFromWordPress(options: UserSearchOptions = {}): Promise<User[]> {
        try {
            const params = this.buildSearchParams(options);
            const response = await apiFetch({
                path: `/wp/v2/users?${params.toString()}`,
            });

            // WordPress returns users directly as array
            const wpUsers = Array.isArray(response) ? response : [];
            return this.transformUsers(wpUsers);
        } catch (error) {
            console.error('Failed to fetch users from WordPress:', error);
            throw error;
        }
    }

    /**
     * Get a specific user by ID
     */
    static async getUserById(userId: number): Promise<User | null> {
        try {
            const response = await apiFetch({
                path: `/wp/v2/users/${userId}`,
            });

            return response ? this.transformUser(response) : null;
        } catch (error) {
            console.error(`Failed to fetch user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get current user
     */
    static async getCurrentUser(): Promise<User | null> {
        try {
            // Fallback to WordPress API
            const response = await apiFetch({
                path: '/wp/v2/users/me',
            });

            return response ? this.transformUser(response) : null;
        } catch (error) {
            console.error('Failed to get current user:', error);
            throw error;
        }
    }

    /**
     * Search users with debouncing
     */
    static searchUsers = debounce(
        async (searchTerm: string, options: Omit<UserSearchOptions, 'searchTerm'> = {}): Promise<User[]> => {
            return this.getUsers({ ...options, searchTerm });
        },
        300
    );

    /**
     * Get users formatted for react-select (legacy compatibility)
     */
    static async getUsersForSelect(options: UserSearchOptions = {}): Promise<Array<{ label: string; value: string }>> {
        try {
            const users = await this.getUsers(options);
            return users.map(user => ({
                label: user.display_name + ' (' + user.email + ')',
                value: user.id.toString(),
            }));
        } catch (error) {
            console.error('Failed to fetch users for select:', error);
            return [];
        }
    }

    /**
     * Get users formatted for report filters (legacy compatibility)
     */
    static async getUsersForReports(options: UserSearchOptions = {}): Promise<Array<{ id: number; display_name: string; email: string }>> {
        try {
            const users = await this.getUsers(options);
            return users.map(user => ({
                id: user.id,
                display_name: user.display_name + ' (' + user.email + ')',
                email: user.email,
            }));
        } catch (error) {
            console.error('Failed to fetch users for reports:', error);
            return [];
        }
    }
}
