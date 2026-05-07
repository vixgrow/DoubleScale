/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { Field } from '@doublescale/components';
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
		<div className="w-full">
			{/* Header */}
			<div className="grid grid-cols-3 gap-4 p-4 border-b font-medium bg-gray-50">
				<div className="text-sm font-semibold">
					{__('Source List', 'doublescale')}
				</div>
				<div className="text-sm font-semibold">
					{__('Assign to (DoubleScale)', 'doublescale')}
				</div>
				<div className="text-sm font-semibold">
					{__('Auto Create', 'doublescale')}
				</div>
			</div>

			{/* Body */}
			<div className="divide-y">
				{lists.map((listItem) => {
					const record = { list: listItem };
					const assigned = mapping.find(
						(item) => item.list === record.list
					);

					return (
						<div
							key={record.list}
							className="grid grid-cols-3 gap-4 p-4 items-center"
						>
							{/* Source List */}
							<div className="text-sm">{record.list}</div>

							{/* Assign to DoubleScale */}
							<div>
								{assigned?.auto ? (
									<div className="text-sm text-gray-600">
										{__(
											'List will be created automatically',
											'doublescale'
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
							</div>

							{/* Auto Create */}
							<div>
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
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
export default ListsMapping;
