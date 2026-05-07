/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Label } from '@doublescale/components/ui/label';
import { Switch } from '@doublescale/components/ui/switch';
import { ListField, TagField, ContactMappedFields } from '@doublescale/components';

interface MappingDialogProps {
	onChange: (value: { [key: string]: string }) => void;
	onChangeAll: (value: any) => void;
	values: { [key: string]: string };
	allValues: any;
	fields: {
		[key: string]: {
			label: string;
		};
	};
}

const MappingDialog: React.FC<MappingDialogProps> = ({
	onChange,
	onChangeAll,
	values,
	allValues,
	fields,
}) => {
	const {
		lists = [],
		tags = [],
		update_existing_contact = false,
		update_blank_fields = false,
		mark_as_subscribed = false,
	} = allValues;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-4">
				<h3 className="text-base font-semibold mb-2">
					{__('Map Fields', 'doublescale')}
				</h3>
				<ContactMappedFields
					values={values}
					onChange={onChange}
					fields={fields}
				/>
			</div>
			
			<div className="border-t pt-4 mt-4">
				<h3 className="text-base font-semibold mb-2">
					{__('Contact Settings', 'doublescale')}
				</h3>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-4 w-full">
						<div className="flex flex-col gap-2.5">
							<Label>{__('Lists', 'doublescale')}</Label>
							<ListField
								value={lists}
								onChange={(value) => {
									onChangeAll({
										...allValues,
										lists: value,
									});
								}}
							/>
						</div>
						<div className="flex flex-col gap-2.5">
							<Label>{__('Tags', 'doublescale')}</Label>
							<TagField
								value={tags}
								onChange={(value) => {
									onChangeAll({
										...allValues,
										tags: value,
									});
								}}
							/>
						</div>
					</div>
					<div className="flex gap-2.5 justify-between items-center">
						<Label>
							{__('Update existing contact', 'doublescale')}
						</Label>
						<Switch
							checked={update_existing_contact}
							onCheckedChange={(value) => {
								onChangeAll({
									...allValues,
									update_existing_contact: value,
								});
							}}
						/>
					</div>
					<div className="flex gap-2.5 justify-between items-center">
						<Label>
							{__('Update blank fields', 'doublescale')}
						</Label>
						<Switch
							checked={update_blank_fields}
							onCheckedChange={(value) => {
								onChangeAll({
									...allValues,
									update_blank_fields: value,
								});
							}}
						/>
					</div>
					<div className="flex gap-2.5 justify-between items-center">
						<Label>
							{__('Mark as Subscribed', 'doublescale')}
						</Label>
						<Switch
							checked={mark_as_subscribed}
							onCheckedChange={(value) => {
								onChangeAll({
									...allValues,
									mark_as_subscribed: value,
								});
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MappingDialog;
