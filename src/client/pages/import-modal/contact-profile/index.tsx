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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Field } from '@doublescale/components';
import { useImportContext } from '../contexts';

interface ContactProfileProps {
	showStatusField?: boolean;
}

const ContactProfile: React.FC<ContactProfileProps> = ({
	showStatusField = true,
}) => {
	const { state, dispatch } = useImportContext();
	const {
		assignedLists,
		assignedTags,
		newStatus,
		sendDoubleOptin,
		updateExisting,
		source,
	} = state;

	const statusOptions = [
		{ label: __('Subscribed', 'doublescale'), value: 'subscribed' },
		{ label: __('Unsubscribed', 'doublescale'), value: 'unsubscribed' },
		{ label: __('Bounced', 'doublescale'), value: 'bounced' },
		{ label: __('Unverified', 'doublescale'), value: 'unverified' },
	];

	const shouldShowStatus =
		showStatusField && ['csv', 'wpusers', 'wc_customers'].includes(source);

	return (
		<Card className="shadow-none rounded-2xl">
			<CardHeader>
				<CardTitle className="text-2xl font-normal text-[#09090B] flex items-center gap-2">
					<span>{__('Contact Profile', 'doublescale')}</span>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<HelpCircle className="w-5 h-5 text-gray-400 cursor-help" />
							</TooltipTrigger>
							<TooltipContent className="z-[160000] bg-gray-100 border-none max-w-xs text-gray-600 text-sm">
								<p>
									{__(
										'Contact Profile settings help you organize and manage imported contacts efficiently. Assign contacts to lists for targeted campaigns, add tags for segmentation, set their subscription status, and control how duplicate contacts are handled. These settings ensure your contacts are properly categorized from the moment they enter your CRM.',
										'doublescale'
									)}
								</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</CardTitle>
				<div className="text-lg text-[#71717A]">
					{__(
						'Configure how contacts will be organized in DoubleScale',
						'doublescale'
					)}
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<Field
						label={__('Assign to Lists', 'doublescale')}
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
							'doublescale'
						)}
					/>
					<Field
						label={__('Assign to Tags', 'doublescale')}
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
							'doublescale'
						)}
					/>
				</div>

				<div className="space-y-4">
					{shouldShowStatus && (
						<>
							<Field
								label={__('Status', 'doublescale')}
								type="select"
								value={newStatus}
								onChange={(value) => {
									dispatch({
										type: 'SET_NEW_STATUS',
										payload: value,
									});
									if (value !== 'unverified') {
										dispatch({
											type: 'SET_SEND_DOUBLE_OPTIN',
											payload: false,
										});
									}
								}}
								options={statusOptions}
								required={false}
								tooltip={__(
									'Set the subscription status for imported contacts. Subscribed contacts can receive emails, while unsubscribed or bounced contacts will be excluded from campaigns.',
									'doublescale'
								)}
							/>

							{newStatus === 'unverified' && (
								<div className="flex items-center justify-between pt-2 border-t">
									<div className="flex flex-col gap-1">
										<Label className="text-base text-[#09090B]">
											{__(
												'Send Double Opt-in Email',
												'doublescale'
											)}
										</Label>
										<p className="text-sm text-muted-foreground">
											{__(
												'Send a confirmation email to new contacts to verify their subscription',
												'doublescale'
											)}
										</p>
									</div>
									<Switch
										checked={sendDoubleOptin}
										onCheckedChange={(value) =>
											dispatch({
												type: 'SET_SEND_DOUBLE_OPTIN',
												payload: value,
											})
										}
									/>
								</div>
							)}
						</>
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
								'doublescale'
							)}
						/>
						<div className="text-[#09090B] font-normal text-base">
							{__('Update Existing Contacts', 'doublescale')}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default ContactProfile;
