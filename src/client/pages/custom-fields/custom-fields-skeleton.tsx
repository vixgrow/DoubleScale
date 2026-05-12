import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export const CustomFieldsSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col gap-[10px]">
                <div
                    className="custom-fields-group flex flex-col gap-[10px] border border-[#f0f0f0] rounded-md flex-1"
                >
                    {/* Group Header - matches exact DroppableGroup structure */}
                    <div className="custom-fields-group-header flex justify-between items-center p-5 rounded-md bg-[#f9f9f9]">
                        <div className="custom-fields-group-title text-xl font-semibold text-[#333333] m-0 capitalize">
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <div className="flex gap-6 items-center border-l pl-6">
                            {/* Copy Icon */}
                            <Skeleton className="h-6 w-6" />
                            {/* Edit Icon */}
                            <Skeleton className="h-6 w-6" />
                            {/* Delete Icon */}
                            <Skeleton className="h-6 w-6" />
                        </div>
                    </div>

                    {/* Table - matches exact DataTable structure */}
                    <div className="custom-fields-group-items p-5">
                        <div className="rounded-t-md border w-full">
                            <Table>
                                <TableHeader className="bg-[#FAFAFA]">
                                    <TableRow>
                                        {/* Checkbox column */}
                                        <TableHead className="text-[#09090B] w-12">
                                            <Skeleton className="h-4 w-4" />
                                        </TableHead>
                                        {/* Name column */}
                                        <TableHead className="text-[#09090B]">
                                            <Skeleton className="h-4 w-12" />
                                        </TableHead>
                                        {/* Type column */}
                                        <TableHead className="text-[#09090B]">
                                            <Skeleton className="h-4 w-10" />
                                        </TableHead>
                                        {/* Created At column */}
                                        <TableHead className="text-[#09090B]">
                                            <Skeleton className="h-4 w-20" />
                                        </TableHead>
                                        {/* Actions column */}
                                        <TableHead className="text-[#09090B]">
                                            <Skeleton className="h-4 w-16" />
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Array.from({ length: 4 }).map((_, rowIndex) => (
                                        <TableRow key={rowIndex} className="hover:bg-gray-50">
                                            {/* Checkbox */}
                                            <TableCell className="text-[#09090B]">
                                                <Skeleton className="h-4 w-4" />
                                            </TableCell>
                                            {/* Field Name */}
                                            <TableCell className="text-[#09090B]">
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="h-4 w-32" />
                                                </div>
                                            </TableCell>
                                            {/* Field Type */}
                                            <TableCell className="text-[#09090B]">
                                                <Skeleton className="h-4 w-20" />
                                            </TableCell>
                                            {/* Created At */}
                                            <TableCell className="text-[#09090B]">
                                                <Skeleton className="h-4 w-16" />
                                            </TableCell>
                                            {/* Actions */}
                                            <TableCell className="text-[#09090B]">
                                                <div className="flex gap-2">
                                                    {/* Move button */}
                                                    <Skeleton className="h-8 w-8 rounded" />
                                                    {/* Edit button */}
                                                    <Skeleton className="h-8 w-8 rounded" />
                                                    {/* Delete button */}
                                                    <Skeleton className="h-8 w-8 rounded" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
        </div>
    );
};
