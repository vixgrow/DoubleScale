/**
 * WordPress dependencies
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import { debounce } from 'lodash';

/**
 * Internal dependencies
 */
import { UserService, User } from '../../../../services/user-service';

/**
 * Custom hook for managing users (owners) with search functionality
 * Now uses centralized UserService for consistent API handling
 */
export const useUsers = () => {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);

	// Load users with optional search
	const loadUsers = useCallback(async (searchTerm = '') => {
		setLoading(true);
		try {
			const fetchedUsers = await UserService.getUsers({
				searchTerm,
				perPage: 50,
				orderBy: 'name',
				order: 'asc',
				context: 'edit',
			});
			setUsers(fetchedUsers);
		} catch (error) {
			console.error('Failed to load users:', error);
			setUsers([]);
		} finally {
			setLoading(false);
		}
	}, []);

	// Internal search function
	const internalSearchUsers = useCallback(async (searchTerm: string) => {
		setLoading(true);
		try {
			const fetchedUsers = await UserService.getUsers({
				searchTerm,
				perPage: 50,
				orderBy: 'name',
				order: 'asc',
				context: 'edit',
			});
			setUsers(fetchedUsers);
		} catch (error) {
			console.error('Failed to search users:', error);
			setUsers([]);
		} finally {
			setLoading(false);
		}
	}, []);

	// Debounced search function
	const searchUsers = useMemo(
		() => debounce(internalSearchUsers, 300),
		[internalSearchUsers]
	);

	// Ensure a specific user is included in the list (for current owners)
	const ensureUserIncluded = useCallback((user: User) => {
		setUsers((currentUsers) => {
			const exists = currentUsers.find(
				(u) => Number(u.id) === Number(user.id)
			);
			if (!exists) {
				return [user, ...currentUsers];
			}
			return currentUsers;
		});
	}, []);

	return {
		users,
		loading,
		loadUsers,
		searchUsers,
		ensureUserIncluded,
	};
};
