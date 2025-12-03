/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { HelpCircle } from 'lucide-react';
/**
 * internal dependencies
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
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
				<CardTitle className="text-2xl font-normal text-[#09090B] flex items-center gap-2">
					<span>{__('Contact Profile', 'quillcrm')}</span>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<HelpCircle className="w-5 h-5 text-gray-400 cursor-help" />
							</TooltipTrigger>
							<TooltipContent className="z-[160000] bg-gray-100 border-none max-w-xs text-gray-600 text-sm">
								<p>
									{__(
										'Contact Profile settings help you organize and manage imported contacts efficiently. Assign contacts to lists for targeted campaigns, add tags for segmentation, set their subscription status, and control how duplicate contacts are handled. These settings ensure your contacts are properly categorized from the moment they enter your CRM.',
										'quillcrm'
									)}
								</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
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
						tooltip={__(
							'Automatically add all imported contacts to specific lists. This helps organize contacts by source or campaign for targeted email marketing.',
							'quillcrm'
						)}
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
						tooltip={__(
							'Tag all imported contacts with specific labels. Tags help categorize and segment contacts for better filtering and automation.',
							'quillcrm'
						)}
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
							tooltip={__(
								'Set the subscription status for imported contacts. Subscribed contacts can receive emails, while unsubscribed or bounced contacts will be excluded from campaigns.',
								'quillcrm'
							)}
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
							tooltip={__(
								'When enabled, existing contacts with matching emails will be updated with new data. When disabled, duplicate contacts will be skipped during import.',
								'quillcrm'
							)}
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
