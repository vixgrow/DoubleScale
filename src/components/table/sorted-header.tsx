import { Column } from '@tanstack/react-table';
import { SortIcon } from '../icons';

const SortedHeaderCell = <T,>({
	column,
	header,
}: {
	column: Column<T>;
	header: string;
}) => (
	<div
		className="flex items-center gap-1 cursor-pointer"
		onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
	>
		{header}
		<SortIcon />
	</div>
);

export default SortedHeaderCell;
