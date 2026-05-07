/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './style.scss';
import { useContactContext } from '../state/context';
import type { LMSCoursesResponse, NoticeMessage } from '@doublescale/client';
import { DataTable } from '@/components/ui/data-table';
import { GradientCoursesIcon, NoData, NoticeBanner } from '@doublescale/components';
import { getColumns } from './columns';
import { useServerSideTable } from '@doublescale/hooks/use-serverSideTable';
import DataTablePagination from '@doublescale/components/ui/data-table-pagination';

interface CoursesProps {
    contact_id: number;
}

const Courses = ({ contact_id }: CoursesProps) => {
    const { courses, setCourses } = useContactContext();
    const [loading, setLoading] = useState(true);
    const [perPage, setPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [notice, setNotice] = useState<NoticeMessage | null>(null);
    const noticeBannerRef = useRef<HTMLDivElement>(null);

    const serverSideTable = useServerSideTable({
        page,
        perPage,
        totalRecords,
        setPage,
        setPerPage,
    });

    const showNotice = (type: 'success' | 'error', message: string) => {
        setNotice({ type, message });
    };

    const closeNotice = () => {
        setNotice(null);
    };

    useEffect(() => {
        if (notice && noticeBannerRef.current) {
            noticeBannerRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [notice]);

    const fetchCourses = async () => {
        setLoading(true);
        setNotice(null);
        try {
            const response = (await apiFetch({
                path: addQueryArgs(
                    `/doublescale/v1/contacts/${contact_id}/lms-courses`,
                    {
                        per_page: perPage,
                        page,
                    }
                ),
            })) as LMSCoursesResponse;

            setCourses(response.data);
            setTotalRecords(response.total);

        } catch (error: any) {
            showNotice(
                'error',
                error?.message || __('Failed to fetch courses', 'doublescale')
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [page, perPage]);

    const columns = useMemo(() => getColumns(), []);

    return (
        <div className="doublescale-courses flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">
                    {__('Courses', 'doublescale')}
                </h2>
            </div>
            {notice && (
                <NoticeBanner
                    ref={noticeBannerRef}
                    notice={notice}
                    closeNotice={closeNotice}
                />
            )}
            <div>
                {!loading && (!courses || courses.length === 0) ? (
                    <NoData
                        icon={<GradientCoursesIcon />}
                        title={__('No courses yet', 'doublescale')}
                        subtitle={__(
                            'No courses have been registered for this contact yet. Course activity will appear here once enrollment begins.',
                            'doublescale'
                        )}
                    />
                ) : (
                    <>
                        <DataTable
                            columns={columns}
                            data={courses || []}
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
        </div>
    );
};

export default Courses;
