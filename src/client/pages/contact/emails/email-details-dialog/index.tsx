/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { useMemo, useCallback, useState, useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import type { CampaignEmail } from '@doublescale/client';
import {
	ClickRateIcon,
	CustomDialogHeader,
	NoEmailsIcon,
	OpenedIcon,
	OpenRateIcon,
	TimeAgoCell,
} from '@doublescale/components';
import { Button } from '@/components/ui/button';
import AttachmentList from '@/components/support/attachment-list';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useResendEmail } from '@/hooks/use-resend-email';
import { useContactContext } from '../../state/context';

interface EmailDetailsProps {
	campaignEmail: CampaignEmail | null;
	onClose: () => void;
	onResendSuccess?: () => void;
	onReply?: ( email: CampaignEmail ) => void;
}

function getEmailSubject( email: CampaignEmail ): string {
	// Prefer resolved subject (merge tags already replaced by backend)
	const resolvedSubject = email.resolved_subject;
	const templateSubject = email.template?.subject;
	const activitySubject = email.activity?.data?.subject;
	return (
		( resolvedSubject && resolvedSubject.trim() ) ||
		( templateSubject && templateSubject.trim() ) ||
		( activitySubject && activitySubject.trim() ) ||
		__( 'No Subject', 'doublescale')
	);
}

function hasRichHtml( html: string ): boolean {
	return /<style[\s>]/i.test( html ) || /<html[\s>]/i.test( html ) || /<table[\s>]/i.test( html );
}

/**
 * Repair email HTML that had <style>/<html>/<head>/<body> stripped by wp_kses_post.
 * Detects orphaned CSS rules (selectors followed by { ... }) before the first <table>
 * and wraps them in proper HTML structure so the iframe renders correctly.
 */
function repairStrippedEmailHtml( html: string ): string {
	if ( /<style[\s>]/i.test( html ) ) {
		return html;
	}

	const tableIdx = html.search( /<table[\s>]/i );
	if ( tableIdx <= 0 ) {
		return html;
	}

	const beforeTable = html.substring( 0, tableIdx );
	const cssPattern = /[.#\w][^{]*\{[^}]+\}/;
	if ( ! cssPattern.test( beforeTable ) ) {
		return html;
	}

	// Extract only the CSS rules from the preamble (skip orphaned text like "96", empty tags, etc.)
	const cssRules: string[] = [];
	const ruleRegex = /(?:[.#@\w][\w\-.,\s#:[\]()=>+~*^$|]*)\{[^}]+\}/g;
	let match;
	while ( ( match = ruleRegex.exec( beforeTable ) ) !== null ) {
		cssRules.push( match[ 0 ] );
	}

	if ( ! cssRules.length ) {
		return html;
	}

	const tableContent = html.substring( tableIdx );
	return `<!DOCTYPE html><html><head><style>${ cssRules.join( '\n' ) }</style></head><body>${ tableContent }</body></html>`;
}

function useRenderedContent( email: CampaignEmail | null ): {
	renderedContent: string;
	isLoading: boolean;
	isFullHtml: boolean;
} {
	const [ renderedContent, setRenderedContent ] = useState< string >( '' );
	const [ isLoading, setIsLoading ] = useState< boolean >( true );
	const [ isFullHtml, setIsFullHtml ] = useState< boolean >( false );

	useEffect( () => {
		if ( ! email ) {
			setIsLoading( false );
			setRenderedContent( '' );
			setIsFullHtml( false );
			return;
		}

		const renderTemplate = async () => {
			setIsLoading( true );

			const templateId = email.template?.id;
			const rawFallback =
				email.template?.body ||
				email.activity?.data?.body ||
				__( 'No content available', 'doublescale');
			const fallbackBody = repairStrippedEmailHtml( String( rawFallback ) );

			if ( templateId ) {
				try {
					const contactId = email.contact_id || email.contact?.id;
					const trackingId = email.id;
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
						setIsFullHtml( hasRichHtml( response.html ) );
					} else {
						setRenderedContent( fallbackBody );
						setIsFullHtml( hasRichHtml( fallbackBody ) );
					}
				} catch ( error ) {
					console.error( 'Failed to render template:', error );
					setRenderedContent( fallbackBody );
					setIsFullHtml( hasRichHtml( fallbackBody ) );
				}
			} else {
				setRenderedContent( fallbackBody );
				setIsFullHtml( hasRichHtml( fallbackBody ) );
			}

			setIsLoading( false );
		};

		renderTemplate();
	}, [ email?.id ] );

	return { renderedContent, isLoading, isFullHtml };
}

const EmailDetails: React.FC< EmailDetailsProps > = ( {
	campaignEmail,
	onClose,
	onResendSuccess,
	onReply,
} ) => {
	const { contact } = useContactContext();

	const isInbound = campaignEmail?.direction_slug === 'inbound';

	const {
		renderedContent,
		isLoading: contentLoading,
		isFullHtml,
	} = useRenderedContent( campaignEmail );

	const { isResending, resendEmail } = useResendEmail( {
		contact,
		onSuccess: onResendSuccess,
	} );

	const handleResendClick = useCallback( () => {
		if ( campaignEmail ) {
			resendEmail( campaignEmail );
		}
	}, [ campaignEmail, resendEmail ] );

	const handleReplyClick = useCallback( () => {
		if ( campaignEmail && onReply ) {
			onReply( campaignEmail );
		}
	}, [ campaignEmail, onReply ] );

	const statusInfo = useMemo( () => {
		if ( ! campaignEmail ) return { className: '', label: '' };
		const statusSlug = campaignEmail.status_slug || 'unknown';
		if ( isInbound ) {
			return {
				className: 'text-blue-700 bg-blue-50 border-blue-200',
				label: __( 'Received', 'doublescale'),
			};
		}
		if ( statusSlug === 'sent' || statusSlug === 'delivered' ) {
			return {
				className: 'text-emerald-700 bg-emerald-50 border-emerald-200',
				label: __( 'Sent', 'doublescale'),
			};
		}
		return {
			className: 'text-red-700 bg-red-50 border-red-200',
			label: __( 'Failed', 'doublescale'),
		};
	}, [ campaignEmail, isInbound ] );

	return (
		<Dialog
			open={ !! campaignEmail }
			onOpenChange={ ( open ) => ! open && onClose() }
		>
			<DialogContent className="z-[150200] max-h-[90vh] w-[min(calc(100vw-2rem),800px)] max-w-[min(calc(100vw-2rem),800px)] overflow-y-auto p-0">
				<DialogHeader className="px-6 pt-6 pb-0">
					<DialogTitle>
						<CustomDialogHeader
							title={
								isInbound
									? __(
											'Received Email Details',
											'doublescale'
									  )
									: __( 'Email Details', 'doublescale' )
							}
							subtitle={
								isInbound
									? __(
											'View the details of the received email',
											'doublescale'
									  )
									: __(
											'View the details of the email',
											'doublescale'
									  )
							}
							icon={ <NoEmailsIcon width={ 24 } height={ 24 } /> }
						/>
					</DialogTitle>
				</DialogHeader>

				{ campaignEmail && (
					<div className="flex w-full flex-col">
							{ /* Subject + Status banner */ }
							<div className="px-6 py-4 border-b bg-gray-50/60">
								<div className="flex items-start justify-between gap-3">
									<h3 className="text-lg font-semibold text-foreground leading-snug flex-1">
										{ getEmailSubject( campaignEmail ) }
									</h3>
									<span
										className={ `shrink-0 border rounded-md px-2.5 py-1 text-xs font-semibold ${ statusInfo.className }` }
									>
										{ statusInfo.label }
									</span>
								</div>
								<div className="text-sm text-gray-500 mt-1">
									<TimeAgoCell
										value={ campaignEmail.sent_at || campaignEmail.created_at }
									/>
								</div>
							</div>

							{ /* Tracking stats — only for outbound */ }
							{ ! isInbound && (
								<div className="px-6 py-3 border-b grid grid-cols-2 gap-3">
									<div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border">
										<div className="bg-[#D1F6DF] p-2 rounded-full text-[#16A34A] shrink-0">
											<OpenRateIcon
												width={ 18 }
												height={ 18 }
											/>
										</div>
										<div className="flex flex-col">
											<span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
												{ __( 'Opened', 'doublescale') }
											</span>
											<div className="flex items-center gap-1.5 mt-0.5">
												{ campaignEmail.opened !=
												'0' ? (
													<>
														<div className="text-green-600">
															<OpenedIcon />
														</div>
														<span className="text-sm font-semibold text-green-700">
															{ campaignEmail.opened_at ? (
																<TimeAgoCell value={ campaignEmail.opened_at } />
															) : (
																__( 'Yes', 'doublescale')
															) }
														</span>
													</>
												) : (
													<span className="text-sm text-gray-400">—</span>
												) }
											</div>
										</div>
									</div>
									<div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border">
										<div className="bg-[#EEE4FF] p-2 rounded-full text-[#660FF1] shrink-0">
											<ClickRateIcon
												width={ 18 }
												height={ 18 }
											/>
										</div>
										<div className="flex flex-col">
											<span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
												{ __( 'Clicked', 'doublescale') }
											</span>
											<div className="flex items-center gap-1.5 mt-0.5">
												{ campaignEmail.clicked !=
												'0' ? (
													<>
														<div className="text-green-600">
															<OpenedIcon />
														</div>
														<span className="text-sm font-semibold text-green-700">
															{ campaignEmail.clicked_at ? (
																<TimeAgoCell value={ campaignEmail.clicked_at } />
															) : (
																__( 'Yes', 'doublescale')
															) }
														</span>
													</>
												) : (
													<span className="text-sm text-gray-400">—</span>
												) }
											</div>
										</div>
									</div>
								</div>
							) }

							{ /* Sent by — only for outbound */ }
							{ ! isInbound && campaignEmail.sent_by && (
								<div className="px-6 py-2.5 border-b flex items-center gap-2 text-sm">
									<span className="text-gray-500 font-medium">
										{ __( 'Sent by', 'doublescale') }
									</span>
									<div className="flex items-center gap-2">
										{ campaignEmail.sent_by.avatar_url && (
											<img
												src={ campaignEmail.sent_by.avatar_url }
												alt=""
												className="w-5 h-5 rounded-full"
											/>
										) }
										<span className="text-foreground font-semibold">
											{ campaignEmail.sent_by.display_name }
										</span>
									</div>
								</div>
							) }

							{ /* Sent from — actual email identity used */ }
							{ ! isInbound && campaignEmail.sent_from?.email && (
								<div className="px-6 py-2.5 border-b flex items-center gap-2 text-sm">
									<span className="text-gray-500 font-medium">
										{ __( 'Sent from', 'doublescale') }
									</span>
									<span className="text-foreground font-semibold">
										{ campaignEmail.sent_from.name
											? `${ campaignEmail.sent_from.name } <${ campaignEmail.sent_from.email }>`
											: campaignEmail.sent_from.email }
									</span>
								</div>
							) }

							{ /* From email — for inbound */ }
							{ isInbound && campaignEmail.activity?.data?.from_email && (
								<div className="px-6 py-2.5 border-b flex items-center gap-2 text-sm">
									<span className="text-gray-500 font-medium">
										{ __( 'From', 'doublescale') }
									</span>
									<span className="text-foreground font-semibold">
										{ campaignEmail.activity.data.from_email }
									</span>
								</div>
							) }

							{ /* Campaign name if applicable */ }
							{ campaignEmail.campaign && (
								<div className="px-6 py-2.5 border-b flex items-center gap-2 text-sm">
									<span className="text-gray-500 font-medium">
										{ __( 'Campaign', 'doublescale') }
									</span>
									<span className="text-foreground font-semibold">
										{ campaignEmail.campaign.name }
									</span>
								</div>
							) }

							{ /* Email body */ }
							<div className="px-6 py-4">
								<div className="text-sm font-medium text-gray-500 mb-2">
									{ __( 'Email Message', 'doublescale') }
								</div>
								{ contentLoading ? (
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

							{ /* Attachments */ }
							{ campaignEmail.attachments?.length ? (
								<div className="px-6 pb-4">
									<div className="text-sm font-medium text-gray-500 mb-2">
										{ __( 'Attachments', 'doublescale' ) }
									</div>
									<AttachmentList
										attachments={ campaignEmail.attachments }
									/>
								</div>
							) : null }
					</div>
				) }

				{ campaignEmail && (
					<DialogFooter className="px-6 pb-6 pt-0">
						{ isInbound ? (
							<Button
								size="xl"
								variant="gradient"
								onClick={ handleReplyClick }
								className="w-full"
							>
								{ __( 'Reply', 'doublescale' ) }
							</Button>
						) : (
							<Button
								size="xl"
								variant="gradient"
								onClick={ handleResendClick }
								disabled={ isResending }
								className="w-full"
							>
								{ isResending
									? __( 'Resending...', 'doublescale' )
									: __(
											'Resend Email again',
											'doublescale'
									  ) }
							</Button>
						) }
					</DialogFooter>
				) }
			</DialogContent>
		</Dialog>
	);
};

export default EmailDetails;
