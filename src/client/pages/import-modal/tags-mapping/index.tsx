/**
 * wordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { Field } from '@doublescale/components';
import { Switch } from '@doublescale/components/ui/switch';

interface TagsMappingProps {
	tags: string[];
	mapping: { tag: string; assignedTag: number[]; auto: boolean }[];
	onChange: (
		value: { tag: string; assignedTag: number[]; auto: boolean }[]
	) => void;
}

const TagsMapping: React.FC<TagsMappingProps> = ({
	tags,
	mapping,
	onChange,
}) => {
	const getOrAddTagToMapped = (tag: string) => {
		const index = mapping.findIndex((item) => item.tag === tag);
		if (index > -1) {
			return { ...mapping[index], index };
		}

		return { tag, assignedTag: [], auto: false, index: -1 };
	};

	return (
		<div className="w-full">
			{/* Header */}
			<div className="grid grid-cols-3 gap-4 p-4 border-b font-medium bg-gray-50">
				<div className="text-sm font-semibold">
					{__('Source Tag', 'doublescale')}
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
				{tags.map((tagItem) => {
					const record = { tag: tagItem };
					const assigned = mapping.find(
						(item) => item.tag === record.tag
					);

					return (
						<div
							key={record.tag}
							className="grid grid-cols-3 gap-4 p-4 items-center"
						>
							{/* Source Tag */}
							<div className="text-sm">{record.tag}</div>

							{/* Assign to DoubleScale */}
							<div>
								{getOrAddTagToMapped(record.tag).auto ? (
									<div className="text-sm text-gray-600">
										{__(
											'Tag will be created automatically',
											'doublescale'
										)}
									</div>
								) : (
									<Field
										type="tags"
										value={
											getOrAddTagToMapped(record.tag)
												.assignedTag
										}
										onChange={(value) => {
											const { tag, index } =
												getOrAddTagToMapped(record.tag);
											if (index > -1) {
												mapping[index].assignedTag =
													value;
												onChange([...mapping]);
											} else {
												onChange([
													...mapping,
													{
														tag,
														assignedTag: value,
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
										const { tag, index } =
											getOrAddTagToMapped(record.tag);
										if (index > -1) {
											mapping[index].auto = value;
											onChange([...mapping]);
										} else {
											onChange([
												...mapping,
												{
													tag,
													assignedTag: [],
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
export default TagsMapping;
