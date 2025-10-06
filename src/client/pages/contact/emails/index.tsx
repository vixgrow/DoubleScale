/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import type { CampaignEmail } from '@quillcrm/client';
import type { EmailAnalytics } from '../state/types';
import { useContactContext } from '../state/context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    ClickRateIcon,
    ContactTotalEmailsIcon,
    OpenRateIcon,
    SendEmailsIcon,
    NoEmailsIcon,
} from '@quillcrm/components';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import { getColumns } from './columns';
import EmailDetails from './email-details-dialog';
import SendEmailDialog from './send-email-dialog';

interface EmailsProps {
    contact_id: number;
}

const Emails: React.FC<EmailsProps> = ({ contact_id }) => {
    const { emailAnalytics, setEmailAnalytics, contact } = useContactContext();
    const [loading, setLoading] = useState<boolean>(true);
    const [perPage, setPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const [total, setTotal] = useState<number>(0);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [campaignEmail, setCampaignEmail] = useState<CampaignEmail | null>(
        null
    );
    const [showSendEmailModal, setShowSendEmailModal] = useState<boolean>(false);
    const { createNotice } = useDispatch('quillcrm/core');

    const serverSideTable = useServerSideTable({
        page,
        perPage,
        totalRecords,
        setPage,
        setPerPage,
    });

    const fetchEmails = async () => {
        setLoading(true);

        try {
            const response = (await apiFetch({
                path: addQueryArgs(
                    `/qc/v1/contacts/${contact_id}/email-campaigns`,
                    {
                        per_page: perPage,
                        page,
                    }
                ),
            })) as EmailAnalytics;

            if (!response || !response.emails) {
                createNotice({
                    type: 'error',
                    message: __('Failed to fetch emails', 'quillcrm'),
                });
                return;
            }

            setEmailAnalytics(response);
            setTotal(response.emails.total);
            setTotalRecords(response.emails.total);
        } catch (error) {
            createNotice({
                type: 'error',
                message: __('Failed to fetch emails', 'quillcrm'),
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmails();
    }, [page, perPage]);

    if (!contact) {
        return null;
    }

    const columns = getColumns({
        onViewTemplate: setCampaignEmail,
    });

    const calculatePercentage = (total: number, value: number) => {
        if (total === 0) {
            return 0;
        }

        return ((value / total) * 100).toFixed(2);
    };

    return (
        <div className="qcrm-emails flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">
                    {__('Emails', 'quillcrm')}
                </h2>
                <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white"
                    onClick={() => setShowSendEmailModal(true)}
                >
                    <SendEmailsIcon />
                    {__('Send Email', 'quillcrm')}
                </Button>
            </div>
            {emailAnalytics && (
                <div className="flex gap-5">
                    <Card className="flex-1 p-3 shadow-none border-l-secondary border-l-[3px] border-y-0 border-r-0">
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-2xl font-semibold">
                                    {total}
                                </span>
                                <span className="text-lg text-gray-500 font-medium">
                                    {__('Total Emails', 'quillcrm')}
                                </span>
                            </div>
                            <div className="bg-[#E4EEFD] px-2 py-4 rounded-full">
                                <ContactTotalEmailsIcon
                                    width={38}
                                    height={22}
                                />
                            </div>
                        </div>
                    </Card>
                    <Card className="flex-1 p-3 shadow-none border-l-[#16A34A] border-l-[3px] border-y-0 border-r-0">
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-2xl font-semibold">
                                    {calculatePercentage(
                                        total,
                                        emailAnalytics.total_opened
                                    )}
                                    %
                                </span>
                                <span className="text-lg text-gray-500 font-medium">
                                    {__('Open Rate', 'quillcrm')}
                                </span>
                            </div>
                            <div className="bg-[#D1F6DF] p-2 rounded-full">
                                <OpenRateIcon width={37} height={39} />
                            </div>
                        </div>
                    </Card>
                    <Card className="flex-1 p-3 shadow-none border-l-[#660FF1] border-l-[3px] border-y-0 border-r-0">
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-2xl font-semibold">
                                    {calculatePercentage(
                                        total,
                                        emailAnalytics.total_clicked
                                    )}
                                    %
                                </span>
                                <span className="text-lg text-gray-500 font-medium">
                                    {__('Click Rate', 'quillcrm')}
                                </span>
                            </div>
                            <div className="bg-[#EEE4FF] p-1.5 rounded-full">
                                <ClickRateIcon width={38} height={38} />
                            </div>
                        </div>
                    </Card>
                </div>
            )}
            <div>
                {!loading && (!emailAnalytics?.emails.data || emailAnalytics.emails.data.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="text-gray-400">
                            <NoEmailsIcon width={120} height={120} />
                        </div>
                        <span className="text-lg text-gray-500 font-medium">
                            {__('No emails found', 'quillcrm')}
                        </span>
                    </div>
                ) : (
                    <>
                        <DataTable
                            columns={columns}
                            data={emailAnalytics?.emails.data || []}
                            loading={loading}
                            showPagination={false}
                            initialPageSize={perPage}
                            showMainActions={false}
                            setPage={setPage}
                            config={{}}
                        />
                        <DataTablePagination table={serverSideTable} />
                    </>
                )}
            </div>
            <EmailDetails
                campaignEmail={campaignEmail}
                onClose={() => setCampaignEmail(null)}
            />
            <SendEmailDialog
                open={showSendEmailModal}
                onClose={() => setShowSendEmailModal(false)}
                contact={contact}
            />
        </div>
    );
};

export default Emails;