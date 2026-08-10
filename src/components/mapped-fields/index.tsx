/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';

import { map } from 'lodash';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MerageTagsIcon } from '@doublescale/components';

interface MappedFieldsProps {
	onChange: (value: { [key: string]: string }) => void;
	values: { [key: string]: string };
	fields: {
		[key: string]: {
			label: string;
		};
	};
}

const MappedFields: React.FC<MappedFieldsProps> = ({
	onChange,
	values,
	fields,
}) => {
	const { setMergeTagsVisible, setMergeTagCallback } =
		useDispatch('doublescale/core');

	const insertMergeTag = (fieldKey: string, currentValue: string) => {
		setMergeTagCallback((tagValue: string) => {
			onChange({
				...values,
				[fieldKey]: (currentValue || '') + tagValue,
			});
		});
		setMergeTagsVisible(true);
	};

	return (
		<div className="flex gap-2.5 flex-col">
			<div className="flex gap-5">
				<span style={{ flex: 1 }}>{__('Field', 'doublescale')}</span>
				<span style={{ flex: 1 }}>
					{__('Value / Merge Tag', 'doublescale')}
				</span>
			</div>
			{map(fields, (_, key) => {
				const currentValue = values ? values[key] || '' : '';
				return (
					<div key={key} className="flex gap-5 items-center">
						<Input
							value={fields[key].label}
							disabled
							style={{ flex: 1 }}
						/>
						<div className="relative flex-1">
							<Input
								value={currentValue}
								onChange={(e) => {
									onChange({
										...values,
										[key]: e.target.value,
									});
								}}
								placeholder={__(
									'Enter value or use merge tags',
									'doublescale'
								)}
								className="pr-10"
							/>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 border-none bg-transparent p-0 text-[#3A3A99] shadow-none hover:bg-transparent"
								title={__('Insert merge tag', 'doublescale')}
								onClick={() =>
									insertMergeTag(key, currentValue)
								}
							>
								<MerageTagsIcon width={24} height={24} />
							</Button>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default MappedFields;
