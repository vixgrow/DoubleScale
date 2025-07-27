/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
/**
 * internal dependencies
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Field } from '@quillcrm/components';
import { useImportContext } from '../contexts';

interface ContactProfileProps {
	showStatusField?: boolean;
}

const ContactProfile: React.FC<ContactProfileProps> = ({
	showStatusField = true,
}) => {
	const { state, dispatch } = useImportContext();
	const { assignedLists, assignedTags, newStatus, updateExisting, source } =
		state;

	const statusOptions = [
		{ label: __('Subscribed', 'quillcrm'), value: 'subscribed' },
		{ label: __('Unsubscribed', 'quillcrm'), value: 'unsubscribed' },
		{ label: __('Bounced', 'quillcrm'), value: 'bounced' },
		{ label: __('Unverified', 'quillcrm'), value: 'unverified' },
	];

	const shouldShowStatus =
		showStatusField && ['csv', 'wpusers', 'wc_customers'].includes(source);

	return (
		<Card className="shadow-none rounded-2xl">
			<CardHeader>
				<CardTitle className="text-2xl font-normal text-[#09090B]">
					{__('Contact Profile', 'quillcrm')}
				</CardTitle>
				<div className="text-lg text-[#71717A]">
					{__(
						'Configure how contacts will be organized in Quill CRM',
						'quillcrm'
					)}
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<Field
						label={__('Assign to Lists', 'quillcrm')}
						type="lists"
						value={assignedLists}
						onChange={(value) =>
							dispatch({
								type: 'SET_ASSIGNED_LISTS',
								payload: value,
							})
						}
						required={false}
					/>
					<Field
						label={__('Assign to Tags', 'quillcrm')}
						type="tags"
						value={assignedTags}
						onChange={(value) =>
							dispatch({
								type: 'SET_ASSIGNED_TAGS',
								payload: value,
							})
						}
						required={false}
					/>
				</div>

				<div className="space-y-4">
					{shouldShowStatus && (
						<Field
							label={__('Status', 'quillcrm')}
							type="select"
							value={newStatus}
							onChange={(value) =>
								dispatch({
									type: 'SET_NEW_STATUS',
									payload: value,
								})
							}
							options={statusOptions}
							required={false}
						/>
					)}

					<div className="flex gap-3 items-center">
						<Field
							type="switch"
							value={updateExisting}
							onChange={(value) =>
								dispatch({
									type: 'SET_UPDATE_EXISTING',
									payload: value,
								})
							}
							required={false}
						/>
						<div className="text-[#09090B] font-normal text-base">
							{__('Update Existing Contacts', 'quillcrm')}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default ContactProfile;
