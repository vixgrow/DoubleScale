import React from 'react';
import { Skeleton } from './skeleton';

interface TableSkeletonProps {
    columns: number;
    rows?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
    columns,
    rows = 5
}) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <td key={colIndex} className="p-4">
                            <Skeleton className="h-4 w-full" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
};
