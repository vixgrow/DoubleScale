/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { Contact } from '../../../types';

interface ContactsResponse {
	data: Contact[];
	total: number;
}

export const useContacts = () => {
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [loading, setLoading] = useState(false);

	const fetchContacts = useCallback(async (search?: string) => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/contacts', {
					per_page: 100, // Limit for dropdown
					keywords: search || '',
				}),
				method: 'GET',
			})) as ContactsResponse;

			setContacts(response.data || []);
		} catch (error) {
			console.error('Failed to fetch contacts:', error);
			setContacts([]);
		} finally {
			setLoading(false);
		}
	}, []);

	const searchContacts = useCallback(
		async (searchValue: string) => {
			if (searchValue.length >= 2) {
				await fetchContacts(searchValue);
			} else if (searchValue.length === 0) {
				// Show recent contacts when no search
				await fetchContacts();
			}
		},
		[fetchContacts]
	);

	useEffect(() => {
		// Load initial contacts
		fetchContacts();
	}, [fetchContacts]);

	return {
		contacts,
		loading,
		searchContacts,
		fetchContacts,
	};
};
