import { useEffect, useMemo } from 'react';

interface UseServerSideTableProps {
    page: number;
    perPage: number;
    totalRecords: number;
    setPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
}

interface ServerSideTable {
    getState: () => {
        pagination: {
            pageIndex: number;
            pageSize: number;
        };
    };
    getPageCount: () => number;
    getFilteredSelectedRowModel: () => { rows: any[] };
    getFilteredRowModel: () => { rows: any[] };
    setPageSize: (size: number) => void;
    setPageIndex: (index: number) => void;
    getCanPreviousPage: () => boolean;
    getCanNextPage: () => boolean;
    previousPage: () => void;
    nextPage: () => void;
}

export const useServerSideTable = ({
    page,
    perPage,
    totalRecords,
    setPage,
    setPerPage,
}: UseServerSideTableProps): ServerSideTable => {
    // A restored page number can point past the end of the current result set
    // (records deleted, or a narrower filter applied since it was saved). Pull
    // the user back to the last page that actually has rows instead of showing
    // an empty table with no obvious way out.
    //
    // Guarded on totalRecords > 0 so this never fires during the initial fetch,
    // when the total is still unknown and would clamp a valid restored page.
    useEffect(() => {
        if (totalRecords <= 0 || perPage <= 0) {
            return;
        }

        const lastPage = Math.max(1, Math.ceil(totalRecords / perPage));

        if (page > lastPage) {
            setPage(lastPage);
        }
    }, [page, perPage, totalRecords, setPage]);

    const serverSideTable = useMemo(() => {
        const totalPages = Math.ceil(totalRecords / perPage);

        return {
            getState: () => ({
                pagination: {
                    pageIndex: page - 1, // Convert to 0-indexed for TanStack Table
                    pageSize: perPage,
                },
            }),
            getPageCount: () => totalPages,
            getFilteredSelectedRowModel: () => ({ rows: [] }),
            getFilteredRowModel: () => ({ rows: Array(totalRecords).fill({}) }),
            setPageSize: (size: number) => {
                setPerPage(size);
                setPage(1); // Reset to first page when changing page size
            },
            setPageIndex: (index: number) => {
                setPage(index + 1); // Convert from 0-indexed to 1-indexed
            },
            getCanPreviousPage: () => page > 1,
            getCanNextPage: () => page < totalPages,
            previousPage: () => {
                if (page > 1) {
                    setPage(page - 1);
                }
            },
            nextPage: () => {
                if (page < totalPages) {
                    setPage(page + 1);
                }
            },
        };
    }, [page, perPage, totalRecords, setPage, setPerPage]);

    return serverSideTable;
};