/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import type { CampaignEmail } from '@doublescale/client';
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
import { CustomDialogHeader, NoEmailsIcon } from '@doublescale/components';

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

const MessageDetailsDialog: React.FC< MessageDetailsDialogProps > = ( {
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
} ) => {
	const [ renderedContent, setRenderedContent ] = useState< string >( '' );
	const [ isLoading, setIsLoading ] = useState< boolean >( true );
	const [ isFullHtml, setIsFullHtml ] = useState< boolean >( false );

	useEffect( () => {
		if ( ! campaignEmail ) {
			setIsLoading( false );
			return;
		}

		const renderTemplate = async () => {
			setIsLoading( true );

			const templateId = campaignEmail.template?.id;

			if ( templateId ) {
				try {
					const contactId =
						campaignEmail?.contact_id || campaignEmail?.contact?.id;
					const trackingId = campaignEmail?.id;
					const response: any = await apiFetch( {
						path: `/doublescale/v1/templates/${ templateId }/render`,
						method: 'POST',
						data: {
							...( contactId ? { contact_id: contactId } : {} ),
							...( trackingId
								? { tracking_id: trackingId }
								: {} ),
							preview: true,
						},
					} );

					if ( response?.html ) {
						setRenderedContent( response.html );
						setIsFullHtml( /<html[\s>]/i.test( response.html ) );
					} else {
						setRenderedContent( messageContent );
						setIsFullHtml( false );
					}
				} catch ( error ) {
					console.error( 'Failed to render template:', error );
					setRenderedContent( messageContent );
					setIsFullHtml( false );
				}
			} else {
				setRenderedContent( messageContent );
				setIsFullHtml( false );
			}

			setIsLoading( false );
		};

		renderTemplate();
	}, [ campaignEmail, messageContent ] );

	return (
		<Dialog open={ open } onOpenChange={ ( open ) => ! open && onClose() }>
			<DialogPortal>
				<DialogOverlay style={ { zIndex } } />
				<DialogContent
					className="max-w-[800px] max-h-[90vh] overflow-y-auto p-0"
					style={ { zIndex } }
				>
					<DialogHeader className="px-6 pt-6 pb-0">
						<DialogTitle>
							<CustomDialogHeader
								title={ title }
								subtitle={ subtitle }
								icon={
									<NoEmailsIcon width={ 24 } height={ 24 } />
								}
							/>
						</DialogTitle>
					</DialogHeader>
					{ campaignEmail && (
						<div className="flex flex-col w-full">
							{ /* Detail fields */ }
							<div className="px-6 py-4 border-b bg-gray-50/60 flex flex-col gap-3">
								{ detailFields
									.filter( ( field ) => ! field.hidden )
									.map( ( field, index ) => (
										<div
											key={ index }
											className="flex justify-between items-center"
										>
											<span className="text-sm font-medium text-gray-500 flex items-center gap-2">
												{ field.icon }
												{ field.label }
											</span>
											<span className="text-base font-semibold text-[#09090B]">
												{ field.value }
											</span>
										</div>
									) ) }
							</div>

							{ /* Email body */ }
							<div className="px-6 py-4">
								<div className="text-sm font-medium text-gray-500 mb-2">
									{ messageLabel }
								</div>
								{ isLoading ? (
									<div className="flex items-center justify-center py-10 text-gray-400 text-sm">
										{ __(
											'Loading content...',
											'doublescale'
										) }
									</div>
								) : isFullHtml ? (
									<iframe
										srcDoc={ renderedContent || '' }
										sandbox="allow-same-origin"
										title={ __(
											'Email content',
											'doublescale'
										) }
										className="w-full rounded-lg border border-gray-200 bg-white"
										style={ { minHeight: '100px' } }
										onLoad={ ( e ) => {
											const iframe =
												e.target as HTMLIFrameElement;
											if ( iframe.contentDocument ) {
												const h =
													iframe.contentDocument.body
														.scrollHeight;
												iframe.style.height =
													Math.max( h, 100 ) + 'px';
											}
										} }
									/>
								) : (
									<div
										className="doublescale-email-body"
										dangerouslySetInnerHTML={ {
											__html: renderedContent || '',
										} }
									/>
								) }
							</div>
						</div>
					) }
					{ footerButton && (
						<DialogFooter className="px-6 pb-6 pt-0">
							<Button
								size="xl"
								variant="gradient"
								onClick={ footerButton.onClick }
								disabled={ footerButton.disabled }
								className="w-full"
							>
								{ footerButton.text }
							</Button>
						</DialogFooter>
					) }
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};

export default MessageDetailsDialog;
