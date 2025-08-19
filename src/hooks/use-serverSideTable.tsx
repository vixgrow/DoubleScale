import { useMemo } from 'react';

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