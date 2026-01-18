/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './style.scss';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import {
    NoticeBanner,
    DeleteModal,
    GradientMeetingsIcon,
    NoData,
    AddMeetingIcon,
} from '@quillcrm/components';
import { DataTable } from '@/components/ui/data-table';
import DataTablePagination from '@/components/ui/data-table-pagination';
import { useServerSideTable } from '@quillcrm/hooks/use-serverSideTable';
import { getColumns } from './columns';
import MeetingDialog from './meeting-dialog';
import type { NoticeMessage } from '@quillcrm/client';

interface Meeting {
    id: number;
    contact_id: number;
    activity_type: string;
    data: {
        meeting_title?: string;
        duration?: number;
        location?: string;
        meeting_date_time?: string;
        meeting_end_time?: string;
        description?: string;
    };
    created_at: string;
    updated_at?: string;
    user?: {
        id: number;
        display_name: string;
    };
}

interface MeetingsProps {
    contact_id: number;
}

const Meetings: React.FC<MeetingsProps> = ({ contact_id }) => {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [perPage, setPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [meetingModalVisible, setMeetingModalVisible] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
    const [notice, setNotice] = useState<NoticeMessage | null>(null);
    const noticeBannerRef = useRef<HTMLDivElement>(null);

    const serverSideTable = useServerSideTable({
        page,
        perPage,
        totalRecords,
        setPage,
        setPerPage,
    });

    // Helper function to show notice
    const showNotice = (type: 'success' | 'error', message: string) => {
        setNotice({ type, message });
    };

    // Helper function to close notice
    const closeNotice = () => {
        setNotice(null);
    };

    // Scroll to notice banner when notice appears
    useEffect(() => {
        if (notice && noticeBannerRef.current) {
            noticeBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [notice]);

    const fetchMeetings = async () => {
        setLoading(true);

        try {
            const response: any = await apiFetch({
                path: addQueryArgs(`/qc/v1/activities`, {
                    contact_id,
                    activity_type: 'meeting_scheduled',
                    per_page: perPage,
                    page,
                }),
            });

            // The API returns an array of activities
            if (Array.isArray(response)) {
                setMeetings(response);
                // Update total: if we got less than perPage, we're on the last page
                if (response.length < perPage) {
                    setTotalRecords((page - 1) * perPage + response.length);
                } else {
                    // If we got a full page, there might be more
                    // Set total to at least current page * perPage
                    setTotalRecords((prev) => {
                        const minTotal = page * perPage;
                        return prev < minTotal ? minTotal : prev;
                    });
                }
            }
        } catch (error: any) {
            showNotice(
                'error',
                error.message || __('Failed to fetch meetings', 'quillcrm')
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, [page, perPage, contact_id]);

    const handleEdit = (meeting: Meeting) => {
        setSelectedMeeting(meeting);
        setMeetingModalVisible(true);
    };

    const handleDelete = (meeting: Meeting) => {
        setMeetingToDelete(meeting);
    };

    const confirmDelete = async () => {
        if (!meetingToDelete) return;

        try {
            await apiFetch({
                path: `/qc/v1/activities/${meetingToDelete.id}`,
                method: 'DELETE',
            });

            setMeetings(meetings.filter((m) => m.id !== meetingToDelete.id));
            fetchMeetings();
            showNotice('success', __('Meeting deleted successfully', 'quillcrm'));
        } catch (error) {
            showNotice('error', __('Failed to delete meeting', 'quillcrm'));
        } finally {
            setMeetingToDelete(null);
        }
    };

    const handleAddMeeting = () => {
        setSelectedMeeting(null);
        setMeetingModalVisible(true);
    };

    const columns = getColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
    });

    return (
        <div className="qcrm-meetings flex flex-col gap-5">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">
                    {__('Meetings', 'quillcrm')}
                </h2>
                <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white"
                    onClick={handleAddMeeting}
                >
                    <AddMeetingIcon />
                    {__('Log Meeting', 'quillcrm')}
                </Button>
            </div>
            {notice && (
                <NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />
            )}
            <div>
                {!loading && (!meetings || meetings.length === 0) ? (
                    <NoData
                        icon={<GradientMeetingsIcon />}
                        title={__('No meetings found yet', 'quillcrm')}
                        subtitle={__('No meetings found—this space is waiting for your plans. Add a time to talk and stay connected.', 'quillcrm')}
                        onClick={handleAddMeeting}
                        buttonLabel={__('Schedule Meeting', 'quillcrm')}
                    />
                ) : (
                    <>
                        <DataTable
                            columns={columns}
                            data={meetings || []}
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
            <MeetingDialog
                open={meetingModalVisible}
                onClose={() => {
                    setMeetingModalVisible(false);
                    setSelectedMeeting(null);
                }}
                contact_id={contact_id}
                selectedMeeting={selectedMeeting}
                onSave={() => {
                    fetchMeetings();
                }}
                onUpdate={() => {
                    fetchMeetings();
                }}
                showNotice={showNotice}
            />
            <DeleteModal
                isOpen={!!meetingToDelete}
                onClose={() => setMeetingToDelete(null)}
                onConfirm={confirmDelete}
                selectedCount={1}
                activeTab="meetings"
            />
        </div>
    );
};

export default Meetings;
