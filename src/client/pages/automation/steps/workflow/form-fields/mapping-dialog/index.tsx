/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { useState } from 'react';

/**
 * Internal dependencies
 */
import { Settings } from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
	DialogOverlay,
	DialogPortal,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@quillcrm/components/ui/label';
import { Switch } from '@quillcrm/components/ui/switch';
import { ListField, TagField, ContactMappedFields } from '@quillcrm/components';

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
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const {
		lists = [],
		tags = [],
		update_existing_contact = false,
		update_blank_fields = false,
		mark_as_subscribed = false,
	} = allValues;

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<Button variant="secondaryDeepBlue" className="w-full">
					{__('Map Fields', 'quillcrm')}
				</Button>
			</DialogTrigger>
			<DialogPortal>
				<DialogOverlay className="z-[150400]" />
				<DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto z-[150400]">
					<DialogHeader>
						<DialogTitle>
							{__('Map Fields', 'quillcrm')}
						</DialogTitle>
						<DialogDescription className="mt-1">
							{__(
								'Map the fields of the form to the contact fields.',
								'quillcrm'
							)}
						</DialogDescription>
					</DialogHeader>
					<ContactMappedFields
						values={values}
						onChange={onChange}
						fields={fields}
					/>

					<div className="border-t pt-4 mt-4">
						<h3 className="text-base font-semibold mb-4">
							{__('Contact Settings', 'quillcrm')}
						</h3>
						<div className="flex flex-col gap-4">
							<div className="flex gap-4 items-center w-full">
								<div className="flex flex-col gap-2.5 w-1/2">
									<Label>{__('Lists', 'quillcrm')}</Label>
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
								<div className="flex flex-col gap-2.5 w-1/2">
									<Label>{__('Tags', 'quillcrm')}</Label>
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
									{__('Update existing contact', 'quillcrm')}
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
									{__('Update blank fields', 'quillcrm')}
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
									{__('Mark as Subscribed', 'quillcrm')}
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

					<DialogFooter>
						<Button
							onClick={() => setIsDialogOpen(false)}
							className="w-full mt-4"
                            variant="gradient"
                            size="xl"
						>
							{__('Submit', 'quillcrm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};

export default MappingDialog;
