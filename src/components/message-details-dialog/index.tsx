/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import type { CampaignEmail } from '@quillcrm/client';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CustomDialogHeader, NoEmailsIcon } from '@quillcrm/components';

interface DetailField {
	label: string;
	value: React.ReactNode;
	icon?: React.ReactNode;
	hidden?: boolean;
}

interface MessageDetailsDialogProps {
	campaignEmail: CampaignEmail | null;
	open: boolean;
	onClose: () => void;
	title: string;
	subtitle: string;
	detailFields: DetailField[];
	messageLabel: string;
	messageContent: string;
	footerButton?: {
		text: string;
		onClick: () => void;
		disabled?: boolean;
	};
	zIndex?: number;
}

const MessageDetailsDialog: React.FC<MessageDetailsDialogProps> = ({
	campaignEmail,
	open,
	onClose,
	title,
	subtitle,
	detailFields,
	messageLabel,
	messageContent,
	footerButton,
	zIndex = 150200,
}) => {
	const [renderedContent, setRenderedContent] = useState<string>('');
	const [isLoading, setIsLoading] = useState<boolean>(true);

	// Render template body from JSON to HTML
	useEffect(() => {
		if (!campaignEmail) {
			setIsLoading(false);
			return;
		}

		const renderTemplate = async () => {
			setIsLoading(true);

			const templateId = campaignEmail.template?.id;

			if (templateId) {
				try {
					// Try to render via API endpoint with contact for merge tags
					// Pass preview=true to strip tracking elements (prevents admin views from counting as opens)
					const contactId = campaignEmail?.contact_id || campaignEmail?.contact?.id;
					const response: any = await apiFetch({
						path: `/qc/v1/templates/${templateId}/render`,
						method: 'POST',
						data: {
							...(contactId ? { contact_id: contactId } : {}),
							preview: true,
						},
					});

					if (response?.html) {
						setRenderedContent(response.html);
					} else {
						// Fallback to displaying body as-is
						setRenderedContent(messageContent);
					}
				} catch (error) {
					console.error('Failed to render template:', error);
					// Fallback to displaying body as-is
					setRenderedContent(messageContent);
				}
			} else {
				// No template ID, use the content as-is
				setRenderedContent(messageContent);
			}

			setIsLoading(false);
		};

		renderTemplate();
	}, [campaignEmail, messageContent]);

	return (
		<Dialog open={open} onOpenChange={(open) => !open && onClose()}>
			<DialogPortal>
				<DialogOverlay style={{ zIndex }} />
				<DialogContent
					className="max-w-[800px] max-h-[90vh] overflow-y-auto"
					style={{ zIndex }}
				>
					<DialogHeader>
						<DialogTitle>
							<CustomDialogHeader
								title={title}
								subtitle={subtitle}
								icon={<NoEmailsIcon width={24} height={24} />}
							/>
						</DialogTitle>
					</DialogHeader>
					{campaignEmail && (
						<div className="flex flex-col gap-5 w-full">
							<div className="flex flex-col gap-4 w-full">
								{detailFields
									.filter((field) => !field.hidden)
									.map((field, index) => (
										<div
											key={index}
											className="flex justify-between items-center"
										>
											<span className="text-base font-medium text-gray-500 flex items-center gap-2">
												{field.icon}
												{field.label}
											</span>
											<span className="text-xl font-semibold text-[#09090B]">
												{field.value}
											</span>
										</div>
									))}
							</div>
							<div className="flex flex-col gap-2 w-full">
								<div className="text-base font-medium text-gray-500">
									{messageLabel}
								</div>
								{isLoading ? (
									<div className="flex items-center justify-center py-8 text-gray-500">
										{__('Loading template...', 'quillcrm')}
									</div>
								) : (
									<div
										className="template-body-preview rounded border"
										dangerouslySetInnerHTML={{
											__html: renderedContent || '',
										}}
									/>
								)}
							</div>
						</div>
					)}
					{footerButton && (
						<DialogFooter className="mt-4">
							<Button
								size="xl"
								variant="gradient"
								onClick={footerButton.onClick}
								disabled={footerButton.disabled}
								className="w-full"
							>
								{footerButton.text}
							</Button>
						</DialogFooter>
					)}
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};

export default MessageDetailsDialog;

