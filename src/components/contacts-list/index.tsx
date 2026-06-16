/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Filter as FilterType, Contact } from '@doublescale/client';
import { ContactsIcon } from '@doublescale/components';
import { SearchIcon } from 'lucide-react';

interface ContactListProps {
	filters?: FilterType[];
	loading?: boolean;
	searchPlaceholder?: string;
	shouldFetch?: boolean;
	onFetchComplete?: () => void;
	onTotalChange?: (total: number) => void;
	onLoadingChange?: (loading: boolean) => void;
	campaignType?: string;
}

const RECIPIENTS_PANEL_BG = '#FAEADF';
const RECIPIENTS_PANEL_BORDER = '#CB5301';

/** Shared campaign recipients card: peach background + dashed border. */
const RecipientsPanelShell: React.FC<{
	children: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
}> = ({ children, className = '', style }) => (
	<div
		className={`relative w-full self-start rounded-xl px-4 py-4 ${className}`}
		style={{ backgroundColor: RECIPIENTS_PANEL_BG, ...style }}
	>
		<svg
			className="pointer-events-none absolute inset-0 h-full w-full overflow-visible rounded-xl"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden
		>
			<rect
				x="1"
				y="1"
				width="calc(100% - 1px)"
				height="calc(100% - 1px)"
				rx="11"
				ry="11"
				fill="none"
				stroke={RECIPIENTS_PANEL_BORDER}
				strokeWidth="1"
				strokeDasharray="44 32"
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
		<div className="relative z-[1] flex h-full min-h-0 flex-col">
			{children}
		</div>
	</div>
);

// Helper function to generate contact initials
const getContactInitials = (firstName: string, lastName: string): string => {
	const first = firstName?.charAt(0)?.toUpperCase() || '';
	const last = lastName?.charAt(0)?.toUpperCase() || '';
	return first + last || '?';
};

const ContactList: React.FC<ContactListProps> = ({
	filters = [],
	loading = false,
	searchPlaceholder = __('Search Recipients', 'doublescale'),
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

		const perPage = 50;

		// Flatten [includeRows, excludeRows] into a 1-D list and stamp each
		// row with its mode. WP core's rest_sanitize_array() calls
		// array_values() on type:'array' params, which silently drops the
		// outer key when only one side is populated — turning an
		// exclude-only payload into an include-only one. Tagging each row
		// keeps include/exclude meaningful regardless of reindexing.
		const includeRows = Array.isArray((filters as any)?.[0])
			? (filters as any)[0]
			: [];
		const excludeRows = Array.isArray((filters as any)?.[1])
			? (filters as any)[1]
			: [];
		const taggedFilters: any[] = [
			...includeRows.map((row: any) => ({ ...row, mode: 'include' })),
			...excludeRows.map((row: any) => ({ ...row, mode: 'exclude' })),
		];

		try {
			const response = await apiFetch<{
				data: Contact[];
				total: number;
				filtered_total?: number;
			}>({
				path: addQueryArgs('/doublescale/v1/contacts', {
					per_page: perPage,
					page: pageNum,
					filters: taggedFilters,
					subscribed: true,
					keywords: search,
					campaign_type: campaignType,
				}),
				method: 'GET',
			});

			const newContacts = Array.isArray(response.data)
				? response.data
				: ([] as Contact[]);

			if (append) {
				setContacts((prev) => [...prev, ...newContacts]);
			} else {
				setContacts(newContacts);
			}

			const totalCount = response.filtered_total ?? response.total;
			setTotal(totalCount);
			// Parent steps (e.g. campaign contacts) gate "Next" on this; sync before async paint.
			onTotalChange?.(totalCount);
			setPage(pageNum);
			setHasMore(newContacts.length === perPage);
		} catch (err: unknown) {
			const message =
				err instanceof Error
					? err.message
					: (err as any)?.message ||
						(err as any)?.data?.message ||
						'Failed to fetch contacts';
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

	const filtersSignature = JSON.stringify(filters ?? []);

	// Refetch when apply is requested (and when pending filters update).
	// Wait for the request so parents that `await fetchContacts()` see an updated total.
	useEffect(() => {
		if (!shouldFetch) {
			return;
		}
		let cancelled = false;
		void (async () => {
			await fetchContacts(1, false, searchTerm);
			if (!cancelled) {
				onFetchComplete?.();
			}
		})();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- run when apply flag / filters / type change; fetch uses latest closure
	}, [shouldFetch, filtersSignature, campaignType]);

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
		<RecipientsPanelShell
			className="flex min-h-0 flex-col overflow-hidden"
			style={{
				height: 'full',
				maxHeight: 'full',
			}}
		>
			<div className="flex gap-3 border-b border-[#CB5301]/30 pb-4 mb-4">
				<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
					<ContactsIcon
						width={22}
						height={22}
						color={RECIPIENTS_PANEL_BORDER}
					/>
				</div>
				<div className="min-w-0 flex-1">
					{error ? (
						<p className="text-sm text-destructive">{error}</p>
					) : (
						<>
							<p className="text-base font-medium text-foreground">
								{isLoading || loading
									? __('Loading…', 'doublescale')
									: sprintf(
											/* translators: %s: number of recipients */
											__(
												'Total Recipients: %s',
												'doublescale'
											),
											total.toLocaleString()
										)}
							</p>
							<p className="mt-2 text-sm font-normal leading-snug text-muted-foreground">
								{__(
									'Contacts must be subscribed to the selected list(s) and meet the selected conditions to receive this campaign.',
									'doublescale'
								)}
							</p>
						</>
					)}
				</div>
			</div>

			<div className="flex shrink-0 items-center gap-2 px-3 h-10 border border-[#CB5301]/30 rounded-lg">
				<SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
				<Input
					type="text"
					placeholder={searchPlaceholder}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="h-10 flex-1 !border-0 !ring-0 !ring-offset-0  !bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
				/>
			</div>

			<div
				className="min-h-0 flex-1 overflow-y-auto"
				onScroll={handleScroll}
			>
				{(isLoading || loading) && contacts.length === 0 ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-gray-500">
							{__('Loading contacts...', 'doublescale')}
						</div>
					</div>
				) : error ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-red-500">{error}</div>
					</div>
				) : contacts.length === 0 ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-gray-500">
							{__('No contacts found', 'doublescale')}
						</div>
					</div>
				) : (
					<>
						{contacts.map((contact) => {
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
									className="flex items-center gap-3 py-3"
								>
									{/* Avatar */}
									<Avatar className="w-10 h-10 rounded-full">
										{avatarUrl ? (
											<AvatarImage
												src={avatarUrl}
												alt={fullName || contact.email}
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
											<div className="truncate text-sm font-semibold capitalize text-foreground">
												{fullName}
											</div>
										)}
										<div className="text-sm text-muted-foreground truncate">
											{contact.email}
										</div>
									</div>
								</div>
							);
						})}

						{/* Loading more indicator */}
						{isLoading && contacts.length > 0 && (
							<div className="flex items-center justify-center py-4">
								<div className="text-muted-foreground text-sm">
									{__(
										'Loading more contacts...',
										'doublescale'
									)}
								</div>
							</div>
						)}

						{/* End of list */}
						{!hasMore && contacts.length > 0 && (
							<div className="flex items-center justify-center py-4">
								<div className="text-muted-foreground text-sm">
									{__(
										'No more contacts to load',
										'doublescale'
									)}
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</RecipientsPanelShell>
	);
};

export default ContactList;
