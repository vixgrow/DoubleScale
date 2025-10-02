/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { useReducer, useRef } from 'react';
import { useParams } from '@quillcrm/navigation';

/**
 * Internal dependencies
 */
import './style.scss';
import { Contact as ContactType, NoticeMessage } from '@quillcrm/client';
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
import { NoticeBanner } from '@quillcrm/components';
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
    const { id: urlId } = useParams<{ id: string; tab: string }>();
    const id = contactId || urlId;
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showFullPageDialog, setShowFullPageDialog] = useState(isDialog);
    const [notice, setNotice] = useState<NoticeMessage | null>(null);
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
                path: `/qc/v1/contacts/${id}`,
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
                path: `/qc/v1/contacts/${id}/email-campaigns?per_page=10&page=1`,
                method: 'GET',
            });

            setEmailAnalytics(response as any);
        } catch (error: any) {
            // Silently fail for email analytics
            console.error('Failed to fetch email analytics:', error);
        }
    };

    const updateContact = async (updatedData?: Partial<ContactType>) => {
        if (!contact) {
            return;
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
                path: `/qc/v1/contacts/${id}`,
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
                message: __('Contact updated successfully', 'quillcrm'),
            });
        } catch (error: any) {
            console.error('Update contact error:', error);
            setNotice({
                type: 'error',
                message: error.message,
            });
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

    return (
        <Dialog
            open={isDialog ? isOpen : showFullPageDialog}
            onOpenChange={(value) => {
                if (!value) {
                    if (isDialog && onClose) {
                        onClose();
                    } else {
                        setShowFullPageDialog(false);
                    }
                }
            }}
        >
            <DialogContent
                className="z-[1600000] w-screen h-screen max-w-none gap-8 overflow-y-auto bg-white rounded-none shadow-none"
                style={{
                    paddingTop: '10px',
                    paddingLeft: '0px',
                    paddingRight: '0px',
                }}
            >
                <DialogHeader className="pb-0 border-b border-[#E4E7EC]">
                    <DialogTitle className="px-12 pb-4 pt-2">
                        <h1 className="text-base font-normal text-[#667085] flex items-center gap-2">
                            {__('Contacts List', 'quillcrm')}
                            <ChevronRight className="w-4 h-4 text-[#667085]" />
                            {__('Contact Details', 'quillcrm')}
                        </h1>
                    </DialogTitle>
                </DialogHeader>
                {loading ? (
                    <div className="px-12">
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
                        }}
                    >
                        <div className="px-12">
                            {notice && (
                                <NoticeBanner
                                    notice={notice}
                                    closeNotice={closeNotice}
                                />
                            )}
                            <div className="flex h-full gap-5">
                                <ContactInformation />
                                <DataCard />
                            </div>
                        </div>
                    </Provider>
                ) : (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-lg text-red-500">
                            {!id
                                ? __('No contact ID provided', 'quillcrm')
                                : __('Contact not found', 'quillcrm')}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default Contact;
