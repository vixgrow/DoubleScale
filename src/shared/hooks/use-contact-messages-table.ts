/**
 * Combined hook for contact messages with table pagination
 *
 * Combines useContactMessages (data fetching) with useServerSideTable (pagination)
 * to provide a complete table solution in a single hook.
 *
 * @since 1.0.0
 */

import { useState, useEffect } from '@wordpress/element';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import { useContactMessages } from './use-contact-messages';

/**
 * Hook options interface
 */
interface UseContactMessagesTableOptions {
	/** Contact ID to fetch messages for */
	contactId: number;
	/** Message channel type */
	mode: 'email' | 'sms' | 'whatsapp';
	/** Initial messages per page */
	initialPerPage?: number;
}

/**
 * Hook return type
 */
interface UseContactMessagesTableReturn {
	/** Loading state */
	loading: boolean;
	/** Array of message objects */
	messages: any[];
	/** Complete analytics data */
	analytics: any;
	/** Error message if fetch failed */
	error: string | null;
	/** Server-side table instance */
	serverSideTable: any;
	/** Current page number */
	page: number;
	/** Messages per page */
	perPage: number;
	/** Total number of records */
	totalRecords: number;
	/** Function to manually refetch messages */
	refetch: () => Promise<void>;
	/** Set page number */
	setPage: (page: number) => void;
	/** Set per page count */
	setPerPage: (perPage: number) => void;
}

/**
 * Combined hook for messages data + table pagination
 *
 * Provides everything needed for a paginated messages table:
 * - Data fetching with loading/error states
 * - Pagination controls
 * - Auto-updates totalRecords from API response
 *
 * @example
 * ```tsx
 * const {
 *   loading,
 *   messages,
 *   analytics,
 *   serverSideTable,
 *   refetch
 * } = useContactMessagesTable({
 *   contactId: 123,
 *   mode: 'email',
 *   initialPerPage: 10
 * });
 *
 * // Use in component
 * <DataTable
 *   data={messages}
 *   loading={loading}
 *   ...
 * />
 * <DataTablePagination table={serverSideTable} />
 * ```
 */
export const useContactMessagesTable = ({
	contactId,
	mode,
	initialPerPage = 10,
}: UseContactMessagesTableOptions): UseContactMessagesTableReturn => {
	// Pagination state
	const [perPage, setPerPage] = useState<number>(initialPerPage);
	const [page, setPage] = useState<number>(1);
	const [totalRecords, setTotalRecords] = useState<number>(0);

	// Initialize server-side table
	const serverSideTable = useServerSideTable({
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
	});

	// Fetch messages data
	const { loading, data, error, refetch } = useContactMessages({
		contactId,
		mode,
		perPage,
		page,
	});

	/**
	 * Update totalRecords when data changes
	 */
	useEffect(() => {
		if (data?.messages?.total !== undefined) {
			setTotalRecords(data.messages.total);
		}
	}, [data]);

	return {
		loading,
		messages: data?.messages?.data || [],
		analytics: data || null,
		error,
		serverSideTable,
		page,
		perPage,
		totalRecords,
		refetch,
		setPage,
		setPerPage,
	};
};
