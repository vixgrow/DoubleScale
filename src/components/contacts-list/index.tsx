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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
		append: boolean = false,
		search: string = ''
	) => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await apiFetch<{ data: Contact[]; total: number; filtered_total?: number }>(
				{
					path: addQueryArgs('/qc/v1/contacts', {
						per_page: 50,
						page: pageNum,
						filters,
						subscribed: true,
						keywords: search,
						campaign_type: campaignType,
					}),
					method: 'GET',
				}
			);

			const newContacts = Array.isArray(response.data)
				? response.data
				: ([] as Contact[]);

			if (append) {
				setContacts((prev) => [...prev, ...newContacts]);
			} else {
				setContacts(newContacts);
			}

			setTotal(response.filtered_total ?? response.total);
			setPage(pageNum);
			setHasMore(newContacts.length === 50);
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : 'Failed to fetch contacts';
			setError(message);
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
			fetchContacts(1, false, searchTerm);
			onFetchComplete?.();
		}
	}, [shouldFetch]);

	// Debounced search - refetch from API with search term
	useEffect(() => {
		if (isInitialMount.current) return;

		const timer = setTimeout(() => {
			fetchContacts(1, false, searchTerm);
		}, 500);

		return () => clearTimeout(timer);
	}, [searchTerm]);

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
				fetchContacts(page + 1, true, searchTerm);
			}
		},
		[hasMore, isLoading, page, searchTerm]
	);

	return (
		<div
			className="w-[45%] bg-[#F8F8F8] rounded-lg border border-gray-200 p-6 flex flex-col"
			style={{
				height: maxHeight > 0 ? `${maxHeight}px` : 'auto',
				maxHeight: maxHeight > 0 ? `${maxHeight}px` : 'none',
			}}
		>
			{/* Header */}
			<div className="flex items-center justify-between gap-4 flex-shrink-0">
				<div className="w-1/2">
					<div className="flex items-center gap-2 mb-2">
						<h3 className="text-lg font-semibold text-gray-900">
							{__('Recipients', 'quillcrm')}
						</h3>
						<span className="text-sm font-semibold text-secondary px-3 py-1 bg-[#C6DFF333] rounded-full">
							{total.toLocaleString()}
						</span>
					</div>
					<p className="text-sm font-semibold text-gray-500">
						{__(
							'Recipients Total Contacts based on filters',
							'quillcrm'
						)}
					</p>
				</div>

				{/* Search */}
				<div className="w-1/2 flex items-center gap-2 p-3 rounded-lg">
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
				className="overflow-y-auto flex-1 min-h-0 mt-3"
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
				) : contacts.length === 0 ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-gray-500">
							{__('No contacts found', 'quillcrm')}
						</div>
					</div>
				) : (
					<>
						{contacts.map(
							(contact) => {
								const fullName =
									`${contact.first_name || ''} ${contact.last_name || ''}`.trim();
								const initials = getContactInitials(
									contact.first_name,
									contact.last_name
								);
								const avatarUrl = (contact as any).avatar_url;

								return (
									<div
										key={contact.id}
										className="flex items-center gap-3 py-3 hover:bg-gray-50 cursor-pointer"
									>
										{/* Avatar */}
										<Avatar className="w-12 h-12 rounded-full">
											{avatarUrl ? (
												<AvatarImage
													src={avatarUrl}
													alt={
														fullName ||
														contact.email
													}
													className="rounded-full"
												/>
											) : null}
											<AvatarFallback className="rounded-full bg-[#E3EEFF99] text-secondary font-bold text-lg">
												{initials}
											</AvatarFallback>
										</Avatar>

										{/* Contact Info */}
										<div className="flex-1 min-w-0">
											{fullName && (
												<div className="font-semibold capitalize text-base text-[#09090B] w-72 truncate">
													{fullName}
												</div>
											)}
											<div className="text-base text-gray-500 truncate">
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
