/**
 * wordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { Field } from '@quillcrm/components';
import { Switch } from '@quillcrm/components/ui/switch';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@quillcrm/components/ui/table';

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
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-1/3">
						{__('Source Tag', 'quillcrm')}
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
				{tags.map((tagItem) => {
					const record = { tag: tagItem };
					const assigned = mapping.find(
						(item) => item.tag === record.tag
					);

					return (
						<TableRow key={record.tag}>
							{/* Source Tag */}
							<TableCell>{record.tag}</TableCell>

							{/* Assign to QuillCRM */}
							<TableCell>
								{getOrAddTagToMapped(record.tag).auto ? (
									<div>
										{__(
											'Tag will be created automatically',
											'quillcrm'
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
							</TableCell>

							{/* Auto Create */}
							<TableCell>
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
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
};
export default TagsMapping;
