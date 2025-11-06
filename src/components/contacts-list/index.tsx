/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { Input } from '@/components/ui/input';
import type { Filter as FilterType, Contact } from '@quillcrm/client';
import { SearchIcon } from 'lucide-react';

interface ContactListProps {
	filters?: FilterType[];
	loading?: boolean;
	searchPlaceholder?: string;
	maxHeight?: number;
	shouldFetch?: boolean;
	onFetchComplete?: () => void;
	onTotalChange?: (total: number) => void;
	onLoadingChange?: (loading: boolean) => void;
	campaignType?: string;
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
	campaignType,
}) => {
	// Simple local state
	const [searchTerm, setSearchTerm] = useState('');
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [total, setTotal] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);

	// Simple fetch function
	const fetchContacts = async (
		pageNum: number = 1,
		append: boolean = false
	) => {
		setIsLoading(true);
		setError(null);

		try {
			const response: any = await apiFetch({
				path: addQueryArgs('/qc/v1/contacts', {
					per_page: 50,
					page: pageNum,
					filters,
					subscribed: true,
					keywords: searchTerm,
					campaign_type: campaignType,
				}),
				method: 'GET',
			});

			const newContacts = response.data || [];

			if (append) {
				setContacts((prev) => [...prev, ...newContacts]);
			} else {
				setContacts(newContacts);
			}

			setTotal(response.total);
			setPage(pageNum);
			setHasMore(newContacts.length === 50);
		} catch (err: any) {
			setError(err.message || 'Failed to fetch contacts');
			console.error('Failed to fetch contacts:', err);
		} finally {
			setIsLoading(false);
		}
	};

	// Notify parent components
	useEffect(() => {
		onTotalChange?.(total);
	}, [total]);

	useEffect(() => {
		onLoadingChange?.(isLoading);
	}, [isLoading]);

	const isInitialMount = useRef(true);

	// Initial fetch
	useEffect(() => {
		fetchContacts(1);
		isInitialMount.current = false;
	}, []);

	// Refetch when filters change (from apply button)
	useEffect(() => {
		if (shouldFetch) {
			fetchContacts(1);
			onFetchComplete?.();
		}
	}, [shouldFetch]);

	// Local search only - compute filtered list client-side (no refetch)
	const normalizedSearch = searchTerm.trim().toLowerCase();
	const displayedContacts = normalizedSearch
		? contacts.filter((c) => {
				const first = String(
					(c as any)?.first_name || ''
				).toLowerCase();
				const last = String((c as any)?.last_name || '').toLowerCase();
				const email = String((c as any)?.email || '').toLowerCase();
				const phone = String((c as any)?.phone || '').toLowerCase();
				const full = `${first} ${last}`.trim();
				return (
					first.includes(normalizedSearch) ||
					last.includes(normalizedSearch) ||
					full.includes(normalizedSearch) ||
					email.includes(normalizedSearch) ||
					phone.includes(normalizedSearch)
				);
			})
		: contacts;

	// Handle infinite scroll
	const handleScroll = useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

			// Load more when near bottom
			if (
				scrollHeight - scrollTop - clientHeight < 100 &&
				hasMore &&
				!isLoading
			) {
				fetchContacts(page + 1, true);
			}
		},
		[hasMore, isLoading, page]
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

			{/* Contacts List */}
			<div
				className="space-y-3 overflow-y-auto flex-1 min-h-0 mt-3"
				onScroll={handleScroll}
			>
				{(isLoading || loading) && contacts.length === 0 ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-gray-500">
							{__('Loading contacts...', 'quillcrm')}
						</div>
					</div>
				) : error ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-red-500">{error}</div>
					</div>
				) : (
						normalizedSearch
							? displayedContacts.length === 0
							: contacts.length === 0
				  ) ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-gray-500">
							{__('No contacts found', 'quillcrm')}
						</div>
					</div>
				) : (
					<>
						{(normalizedSearch ? displayedContacts : contacts).map(
							(contact) => {
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
							}
						)}

						{/* Loading more indicator */}
						{isLoading && contacts.length > 0 && (
							<div className="flex items-center justify-center py-4">
								<div className="text-gray-500 text-sm">
									{__('Loading more contacts...', 'quillcrm')}
								</div>
							</div>
						)}

						{/* End of list */}
						{!hasMore && contacts.length > 0 && (
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
