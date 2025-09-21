/**
 * WordPress dependencies
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { debounce } from 'lodash';

interface User {
	id: number;
	display_name: string;
	email: string;
}

/**
 * Custom hook for managing users (owners) with search functionality
 */
export const useUsers = () => {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);

	// Transform WordPress user format to our expected format
	const transformUsers = useCallback((wpUsers: any[]): User[] => {
		return wpUsers
			.filter((user: any) => user && user.id)
			.map((user: any) => ({
				id: parseInt(user.id),
				display_name: user.name || user.username || `User ${user.id}`,
				email: user.email || '',
			}));
	}, []);

	// Load users with optional search
	const loadUsers = useCallback(
		async (searchTerm = '') => {
			setLoading(true);
			try {
				const params = new URLSearchParams();
				params.append('per_page', '50');
				params.append('orderby', 'name');
				params.append('order', 'asc');
				params.append('context', 'edit');

				if (searchTerm && searchTerm.length >= 2) {
					params.append('search', searchTerm);
				}

				const response = await apiFetch({
					path: `/wp/v2/users?${params.toString()}`,
				});

				// WordPress returns users directly as array
				const wpUsers = Array.isArray(response) ? response : [];
				const transformedUsers = transformUsers(wpUsers);

				setUsers(transformedUsers);
			} catch (error) {
				console.error('Failed to load users:', error);
				setUsers([]);
			} finally {
				setLoading(false);
			}
		},
		[transformUsers]
	);

	// Debounced search function
	const searchUsers = useMemo(
		() =>
			debounce((searchTerm: string) => {
				loadUsers(searchTerm);
			}, 300),
		[loadUsers]
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
