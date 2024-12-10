/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Card, Typography, Table, Flex, Divider } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { convertDate } from '@quillcrm/utils';
import { useContactContext } from '../state/context';
import { LMSCourse } from '@quillcrm/client';

interface CoursesProps {
    contact_id: number;
}

const Courses = ({ contact_id }: CoursesProps) => {
    const { courses, setCourses } = useContactContext();
    const [loading, setLoading] = useState(true);
    const { createNotice } = useDispatch('quillcrm/core');

    const fetchCourses = async () => {
        try {
            const response = await apiFetch({
                path: `/qc/v1/contacts/${contact_id}/lms-courses`,
            }) as LMSCourse[];

            setCourses(response);
        } catch (error: any) {
            createNotice({
                type: 'error',
                message: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const columns = [
        {
            title: __('ID', 'quillcrm'),
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: __('Course', 'quillcrm'),
            dataIndex: 'course',
            key: 'name',
            render: (_, record: LMSCourse) => (
                <Flex gap={10}>
                    {record.name}
                </Flex>
            ),
        },
        {
            title: __('Status', 'quillcrm'),
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: __('Enrolled', 'quillcrm'),
            dataIndex: 'enrolled',
            key: 'started_on',
            render: (_, record: LMSCourse) => record.started_on ? convertDate(record.started_on) : '-',
        },
        {
            title: __('Completed', 'quillcrm'),
            dataIndex: 'completed',
            key: 'completed_on',
            render: (_, record: LMSCourse) => record.completed_on ? convertDate(record.completed_on) : '-',
        },
    ];

    return (
        <Card>
            <Flex vertical gap={20}>
                <Typography.Title level={4}>
                    {__('Courses', 'quillcrm')}
                </Typography.Title>
                <Divider />
                <Table
                    columns={columns}
                    dataSource={courses}
                    rowKey="id"
                    pagination={false}
                    loading={loading}
                />
            </Flex>
        </Card>
    )
};

export default Courses;