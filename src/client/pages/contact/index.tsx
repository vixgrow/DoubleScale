/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { useReducer, useRef, useEffect } from 'react';
import { useParams, useNavigate, getToLink } from '@doublescale/navigation';

/**
 * Internal dependencies
 */
import './style.scss';
import { Contact as ContactType, NoticeMessage } from '@doublescale/client';
import { mapContactIdentifierError } from '@doublescale/shared/utils/contact-identifier-errors';
import type { ContactUpdateResult } from './state/context';
import reducer, { State } from './state/reducer';
import actions from './state/actions';
import { Provider } from './state/context';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import ContactInformation from './contact-information';
import DataCard from './data-card';
import ContactShimmer from './contact-shimmer';
import { NoticeBanner } from '@doublescale/components';
import { ChevronRight } from 'lucide-react';

interface ContactProps {
	contactId?: string;
	isDialog?: boolean;
	isOpen?: boolean;
	onClose?: () => void;
	onContactUpdate?: (contact: ContactType) => void;
}

const Contact: React.FC<ContactProps> = ({
	contactId,
	isDialog = false,
	isOpen = true,
	onClose,
	onContactUpdate,
}) => {
	const { id: urlId, tab: urlTab } = useParams<{ id: string; tab: string }>();
	const navigate = useNavigate();
	const id = contactId || urlId;
	const [loading, setLoading] = useState(true);
	const [isUpdating, setIsUpdating] = useState(false);
	// When used as a route (isDialog=false), the dialog should be open by default
	const [showFullPageDialog, setShowFullPageDialog] = useState(true);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);
	const [state, dispatch] = useReducer(reducer, {
		contact: null,
		notes: [],
		automationContacts: [],
		emailAnalytics: null,
		purchaseHistory: null,
		courses: [],
	} as State);
	const stateRef = useRef<State>(state);
	stateRef.current = state;
	const $actions = actions(dispatch);
	const { setContact, setEmailAnalytics } = $actions;
	const { contact } = state;

	const fetchContact = async () => {
		if (!id) {
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			const response = await apiFetch({
				path: `/doublescale/v1/contacts/${id}`,
				method: 'GET',
			});

			setContact(response as ContactType);

			// Fetch email analytics for the contact
			fetchEmailAnalytics();
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	const fetchEmailAnalytics = async () => {
		if (!id) {
			return;
		}

		try {
			const response = await apiFetch({
				path: `/doublescale/v1/contacts/${id}/messages?mode=email&per_page=10&page=1`,
				method: 'GET',
			});

			setEmailAnalytics(response as any);
		} catch (error: any) {
			// Silently fail for email analytics
			console.error('Failed to fetch email analytics:', error);
		}
	};

	const updateContact = async (
		updatedData?: Partial<ContactType>
	): Promise<ContactUpdateResult> => {
		if (!contact) {
			return { success: false, message: __('Contact not found.', 'doublescale') };
		}

		setIsUpdating(true);
		try {
			// Merge updated data with current contact
			const mergedContact = updatedData
				? { ...contact, ...updatedData }
				: contact;

			// Prepare the data with properly formatted custom fields
			const contactData = {
				...mergedContact,
				custom_fields:
					mergedContact.custom_fields?.map((customField) => ({
						id: customField.id,
						value: customField.pivot?.value || '', // Send only id and value
					})) || [],
			};

			const response = await apiFetch({
				path: `/doublescale/v1/contacts/${id}`,
				method: 'POST',
				data: contactData,
			});

			const updatedContact = response as ContactType;
			setContact(updatedContact);

			// Notify parent component about the update
			if (onContactUpdate) {
				onContactUpdate(updatedContact);
			}

			setNotice({
				type: 'success',
				message: __('Contact updated successfully', 'doublescale'),
			});
			return { success: true };
		} catch (error: any) {
			console.error('Update contact error:', error);
			const mapped = mapContactIdentifierError(error);
			setNotice({
				type: 'error',
				message: mapped.message,
			});
			return {
				success: false,
				message: mapped.message,
				field: mapped.field,
			};
		} finally {
			setIsUpdating(false);
		}
	};

	useEffect(() => {
		if (id) {
			fetchContact();
		} else {
			setLoading(false);
		}
	}, [id]);

	const closeNotice = () => {
		setNotice(null);
	};

	// Scroll to notice banner when notice appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			});
		}
	}, [notice]);

	const handleClose = () => {
		if (isDialog && onClose) {
			onClose();
		} else {
			// Navigate back to previous page (deal detail, contacts list, etc.)
			if (window.history.length > 1) {
				window.history.back();
			} else {
				// Fallback to contacts list if no history
				navigate(getToLink('contacts'));
			}
		}
	};

	return (
		<Dialog
			open={isDialog ? isOpen : showFullPageDialog}
			onOpenChange={(value) => {
				if (!value) {
					handleClose();
				}
			}}
			modal={false}
		>
			<DialogContent
				className="doublescale-contact-page z-[140000] flex h-screen max-h-screen w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-gradient-to-br from-slate-50 via-[#eef1f7] to-slate-100/95 p-0 shadow-none"
				style={{
					paddingTop: '0px',
					paddingLeft: '0px',
					paddingRight: '0px',
					paddingBottom: '0px',
				}}
			>
				<DialogHeader className="shrink-0 border-b border-border/50 bg-white/90 pb-0 shadow-[inset_0_-1px_0_0_rgba(15,23,42,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
					<DialogTitle className="sr-only">
						{__('Contact Details', 'doublescale')}
					</DialogTitle>
					<div className="mx-auto flex w-full max-w-[1680px] items-center px-6 py-3.5 sm:px-10">
						<nav
							className="text-sm font-medium text-muted-foreground flex flex-wrap items-center gap-2"
							aria-label={__('Breadcrumb', 'doublescale')}
						>
							<button
								type="button"
								onClick={() => navigate(getToLink('contacts'))}
								className="rounded-md px-2 py-1 -mx-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
							>
								{__('Contacts List', 'doublescale')}
							</button>
							<ChevronRight
								className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
								aria-hidden
							/>
							<span className="rounded-md bg-muted/50 px-2.5 py-1 text-foreground font-semibold tracking-tight">
								{__('Contact Details', 'doublescale')}
							</span>
						</nav>
					</div>
				</DialogHeader>
				{loading ? (
					<div className="doublescale-contact-page-column-scroll mx-auto min-h-0 w-full max-w-[1680px] flex-1 overflow-y-auto px-6 py-8 sm:px-10">
						<ContactShimmer />
					</div>
				) : contact ? (
					<Provider
						value={{
							...state,
							...$actions,
							isLoading: loading,
							isUpdating: isUpdating,
							updateContact,
							showNotice: setNotice,
						}}
					>
						<div className="mx-auto flex min-h-0 w-full max-w-[1680px] flex-1 flex-col overflow-y-auto px-6 py-8 sm:px-10 lg:overflow-hidden">
							{notice && (
								<div className="mb-4 shrink-0">
									<NoticeBanner
										ref={noticeBannerRef}
										notice={notice}
										closeNotice={closeNotice}
									/>
								</div>
							)}
							<div className="flex flex-col gap-6 lg:min-h-0 lg:flex-1 lg:flex-row lg:items-stretch lg:gap-6 lg:overflow-hidden">
								<div className="doublescale-contact-page-column-scroll w-full shrink-0 lg:min-h-0 lg:max-w-[400px] lg:w-[min(100%,400px)] lg:overflow-y-auto">
									<ContactInformation />
								</div>
								<div className="doublescale-contact-page-column-scroll min-w-0 flex-1 lg:min-h-0 lg:overflow-y-auto">
									<DataCard
										navigate={navigate}
										initialTab={urlTab}
									/>
								</div>
							</div>
						</div>
					</Provider>
				) : (
					<div className="flex flex-1 items-center justify-center px-6 py-16">
						<div className="rounded-2xl border border-border/60 bg-card px-8 py-10 text-center shadow-sm">
							<p className="text-base font-medium text-destructive">
								{!id
									? __('No contact ID provided', 'doublescale')
									: __('Contact not found', 'doublescale')}
							</p>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default Contact;
