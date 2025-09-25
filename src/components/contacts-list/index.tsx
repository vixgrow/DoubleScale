/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Input } from '@/components/ui/input';
import type { Filter as FilterType } from '@quillcrm/client';
import { SearchIcon } from 'lucide-react';
import { STORE_KEY } from '@/stores/contacts';

interface ContactListProps {
	filters?: FilterType[];
	loading?: boolean;
	searchPlaceholder?: string;
	maxHeight?: number;
	shouldFetch?: boolean;
	onFetchComplete?: () => void;
	onTotalChange?: (total: number) => void;
	onLoadingChange?: (loading: boolean) => void;
}

// Helper function to generate contact initials
const getContactInitials = (firstName: string, lastName: string): string => {
	const first = firstName?.charAt(0)?.toUpperCase() || '';
	const last = lastName?.charAt(0)?.toUpperCase() || '';
	return first + last || '?';
};

// Helper function to generate background color based on name
const getAvatarColor = (name: string): string => {
	const colors = [
		'bg-blue-500',
		'bg-green-500',
		'bg-purple-500',
		'bg-pink-500',
		'bg-indigo-500',
		'bg-red-500',
		'bg-yellow-500',
		'bg-teal-500',
	];

	const hash = name.split('').reduce((acc, char) => {
		return acc + char.charCodeAt(0);
	}, 0);

	return colors[hash % colors.length];
};

const ContactList: React.FC<ContactListProps> = ({
	filters = [],
	loading = false,
	searchPlaceholder = __('Search Recipients', 'quillcrm'),
	maxHeight = 0,
	shouldFetch = false,
	onFetchComplete,
	onTotalChange,
	onLoadingChange,
}) => {
	const [searchTerm, setSearchTerm] = useState('');

	// Get data from store
	const {
		contacts,
		total,
		isLoadingContacts,
		contactsError,
		hasMoreContacts,
	} = useSelect((select: any) => {
		const store = select(STORE_KEY);
		return {
			contacts: store.getContacts(),
			total: store.getContactsTotal(),
			isLoadingContacts: store.isLoadingContacts(),
			contactsError: store.getContactsError(),
			hasMoreContacts: store.hasMoreContacts(),
		};
	}, []);

	// Store actions
	const { fetchContacts, setFilters, setSearchKeywords, loadMoreContacts } =
		useDispatch(STORE_KEY) as any;

	// Fetch contacts using store action
	const handleFetchContacts = async (search = '') => {
		try {
			await fetchContacts({
				filters,
				keywords: search,
				page: 1,
				perPage: 50,
				subscribed: true,
			});
		} catch (error) {
			console.error('Failed to fetch contacts:', error);
		}
	};

	// Notify parent components of state changes
	useEffect(() => {
		if (onTotalChange) {
			onTotalChange(total);
		}
	}, [total, onTotalChange]);

	useEffect(() => {
		if (onLoadingChange) {
			onLoadingChange(isLoadingContacts);
		}
	}, [isLoadingContacts, onLoadingChange]);

	// Initial fetch on component mount
	useEffect(() => {
		handleFetchContacts(searchTerm);
	}, []);

	// Refetch when shouldFetch is true (when apply filters is clicked)
	useEffect(() => {
		if (shouldFetch) {
			// Update store filters
			setFilters(filters);
			handleFetchContacts(searchTerm);
			if (onFetchComplete) {
				onFetchComplete();
			}
		}
	}, [shouldFetch, filters]);

	// Debounce search
	useEffect(() => {
		if (searchTerm !== '') {
			const timeoutId = setTimeout(() => {
				setSearchKeywords(searchTerm);
				handleFetchContacts(searchTerm);
			}, 300);

			return () => clearTimeout(timeoutId);
		} else if (searchTerm === '') {
			// If search is cleared, fetch without search term
			setSearchKeywords('');
			handleFetchContacts('');
		}
		// Return undefined for other cases
		return undefined;
	}, [searchTerm]);

	// Handle infinite scroll
	const handleScroll = useCallback(
		async (e: React.UIEvent<HTMLDivElement>) => {
			const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

			// Check if we're near the bottom (within 100px) and can load more
			if (
				scrollHeight - scrollTop - clientHeight < 100 &&
				hasMoreContacts &&
				!isLoadingContacts
			) {
				try {
					await loadMoreContacts({
						filters,
						keywords: searchTerm,
						subscribed: true,
					});
				} catch (error) {
					console.error('Failed to load more contacts:', error);
				}
			}
		},
		[
			hasMoreContacts,
			isLoadingContacts,
			loadMoreContacts,
			filters,
			searchTerm,
		]
	);

	return (
		<div
			className="w-[45%] bg-white rounded-lg border border-gray-200 p-6 flex flex-col"
			style={{
				height: maxHeight > 0 ? `${maxHeight}px` : 'auto',
				maxHeight: maxHeight > 0 ? `${maxHeight}px` : 'none',
			}}
		>
			{/* Header */}
			<div className="flex items-center justify-between gap-4 flex-shrink-0">
				<div className="w-1/2">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="text-lg font-semibold text-gray-900">
							{__('Recipients', 'quillcrm')}
						</h3>
						<span className="text-lg font-semibold text-blue-600 px-5 py-1 bg-blue-50 rounded-full">
							{total.toLocaleString()}
						</span>
					</div>
					<p className="text-sm text-gray-500">
						{__(
							'Recipients Total Contacts based on filters',
							'quillcrm'
						)}
					</p>
				</div>

				{/* Search */}
				<div className="w-1/2 flex items-center gap-2 bg-gray-100 p-3 rounded-lg">
					<SearchIcon className="text-gray-400" />
					<Input
						type="text"
						placeholder={searchPlaceholder}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						style={{
							border: 'none',
							outline: 'none',
							boxShadow: 'none',
							backgroundColor: 'transparent',
						}}
					/>
				</div>
			</div>

			{/* Contacts List - make it fill remaining space but scroll content */}
			<div
				className="space-y-3 overflow-y-auto flex-1 min-h-0 mt-3"
				onScroll={handleScroll}
			>
				{(isLoadingContacts || loading) && contacts.length === 0 ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-gray-500">
							{__('Loading contacts...', 'quillcrm')}
						</div>
					</div>
				) : contactsError ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-red-500">{contactsError}</div>
					</div>
				) : contacts.length === 0 ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-gray-500">
							{__('No contacts found', 'quillcrm')}
						</div>
					</div>
				) : (
					<>
						{contacts.map((contact) => {
							const fullName =
								`${contact.first_name} ${contact.last_name}`.trim();
							const initials = getContactInitials(
								contact.first_name,
								contact.last_name
							);
							const avatarColor = getAvatarColor(
								fullName || contact.email
							);

							return (
								<div
									key={contact.id}
									className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
								>
									{/* Avatar */}
									<div
										className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm ${avatarColor}`}
									>
										{initials}
									</div>

									{/* Contact Info */}
									<div className="flex-1 min-w-0">
										<div className="font-medium text-gray-900 truncate">
											{fullName ||
												__('No Name', 'quillcrm')}
										</div>
										<div className="text-sm text-gray-500 truncate">
											{__('Email:', 'quillcrm')}{' '}
											{contact.email}
										</div>
									</div>
								</div>
							);
						})}

						{/* Loading indicator for infinite scroll */}
						{isLoadingContacts && contacts.length > 0 && (
							<div className="flex items-center justify-center py-4">
								<div className="text-gray-500 text-sm">
									{__('Loading more contacts...', 'quillcrm')}
								</div>
							</div>
						)}

						{/* End of list indicator */}
						{!hasMoreContacts && contacts.length > 0 && (
							<div className="flex items-center justify-center py-4">
								<div className="text-gray-400 text-sm">
									{__('No more contacts to load', 'quillcrm')}
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default ContactList;
