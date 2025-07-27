/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { Field } from '@quillcrm/components';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';

interface ListsMappingProps {
	lists: string[] | null;
	mapping: { list: string; assignedList: number[]; auto: boolean }[];
	onChange: (
		value: { list: string; assignedList: number[]; auto: boolean }[]
	) => void;
}

const ListsMapping: React.FC<ListsMappingProps> = ({
	lists,
	mapping,
	onChange,
}) => {
	if (!lists) {
		return null;
	}

	const getOrAddListToMapped = (list: string) => {
		const index = mapping.findIndex((item) => item.list === list);
		if (index > -1) {
			return { ...mapping[index], index };
		}

		return { list, assignedList: [], auto: false, index: -1 };
	};

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-1/3">
						{__('Source List', 'quillcrm')}
					</TableHead>
					<TableHead className="w-1/3">
						{__('Assign to (QuillCRM)', 'quillcrm')}
					</TableHead>
					<TableHead className="w-1/3">
						{__('Auto Create', 'quillcrm')}
					</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{lists.map((listItem) => {
					const record = { list: listItem };
					const assigned = mapping.find(
						(item) => item.list === record.list
					);

					return (
						<TableRow key={record.list}>
							{/* Source List */}
							<TableCell>{record.list}</TableCell>

							{/* Assign to QuillCRM */}
							<TableCell>
								{assigned?.auto ? (
									<div>
										{__(
											'List will be created automatically',
											'quillcrm'
										)}
									</div>
								) : (
									<Field
										type="lists"
										value={
											getOrAddListToMapped(record.list)
												.assignedList
										}
										onChange={(value) => {
											const { list, index } =
												getOrAddListToMapped(
													record.list
												);
											if (index > -1) {
												mapping[index].assignedList =
													value;
												onChange([...mapping]);
											} else {
												onChange([
													...mapping,
													{
														list,
														assignedList: value,
														auto: false,
													},
												]);
											}
										}}
									/>
								)}
							</TableCell>

							{/* Auto Create */}
							<TableCell>
								<Switch
									checked={assigned?.auto}
									onCheckedChange={(value) => {
										const { list, index } =
											getOrAddListToMapped(record.list);
										if (index > -1) {
											mapping[index].auto = value;
											onChange([...mapping]);
										} else {
											onChange([
												...mapping,
												{
													list,
													assignedList: [],
													auto: value,
												},
											]);
										}
									}}
								/>
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
};
export default ListsMapping;
