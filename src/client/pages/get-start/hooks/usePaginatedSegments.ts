import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useEffect, useState } from '@wordpress/element';

type PaginatedResponse<T> = {
	data: T[];
	total: number;
};

type UsePaginatedSegmentsArgs<T> = {
	endpoint: string;
	initialPerPage?: number;
	parseResponse?: (response: unknown) => PaginatedResponse<T>;
};

type UsePaginatedSegmentsResult<T> = {
	items: T[];
	loading: boolean;
	isSaving: boolean;
	page: number;
	perPage: number;
	totalRecords: number;
	setPage: (page: number) => void;
	setPerPage: (perPage: number) => void;
	setIsSaving: (isSaving: boolean) => void;
	refetch: () => Promise<void>;
};

const defaultParseResponse = <T,>(response: unknown): PaginatedResponse<T> => {
	const safe = (response || {}) as { data?: T[]; total?: number };

	return {
		data: safe.data || [],
		total: safe.total || 0,
	};
};

export function usePaginatedSegments<T>({
	endpoint,
	initialPerPage = 10,
	parseResponse = defaultParseResponse,
}: UsePaginatedSegmentsArgs<T>): UsePaginatedSegmentsResult<T> {
	const [items, setItems] = useState<T[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [perPage, setPerPage] = useState<number>(initialPerPage);
	const [page, setPage] = useState<number>(1);
	const [totalRecords, setTotalRecords] = useState<number>(0);

	const fetchItems = async () => {
		setLoading(true);

		try {
			const response = await apiFetch({
				path: addQueryArgs(endpoint, {
					per_page: perPage,
					page,
				}),
			});

			const parsed = parseResponse(response);

			setItems(parsed.data);
			setTotalRecords(parsed.total);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchItems();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, perPage, endpoint]);

	return {
		items,
		loading,
		isSaving,
		page,
		perPage,
		totalRecords,
		setPage,
		setPerPage,
		setIsSaving,
		refetch: fetchItems,
	};
}


