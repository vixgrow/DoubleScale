import { useState, useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';
import dayjs from 'dayjs';

export interface ReportFilters {
    dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
    ownerId: number | null;
    pipelineId: number | null;
    status: string | null;
    contactId: number | null;
}

export interface FilterOptions {
    owners: Array<{ id: number; display_name: string; email: string }>;
    pipelines: Array<{ id: number; name: string }>;
    contacts: Array<{ id: number; first_name: string; last_name: string }>;
}

export const useReportFilters = () => {
    const [filters, setFilters] = useState<ReportFilters>({
        dateRange: null,
        ownerId: null,
        pipelineId: null,
        status: null,
        contactId: null,
    });

    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        owners: [],
        pipelines: [],
        contacts: [],
    });

    const [showFilters, setShowFilters] = useState(false);

    // Helper function to build query parameters
    const buildQueryParams = () => {
        const params = new URLSearchParams();

        if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
            params.append(
                'date_from',
                filters.dateRange[0].format('YYYY-MM-DD')
            );
            params.append('date_to', filters.dateRange[1].format('YYYY-MM-DD'));
        }

        if (filters.ownerId) {
            params.append('owner_id', filters.ownerId.toString());
        }

        if (filters.pipelineId) {
            params.append('pipeline_id', filters.pipelineId.toString());
        }

        if (filters.status) {
            params.append('status', filters.status);
        }

        if (filters.contactId) {
            params.append('contact_id', filters.contactId.toString());
        }

        return params.toString();
    };

    // Fetch dropdown options
    const fetchFilterOptions = async () => {
        try {
            // Fetch owners (users)
            const usersResponse = await apiFetch({
                path: '/wp/v2/users',
            });

            const owners = usersResponse?.map((user: any) => ({
                id: user.id,
                display_name: user.name,
                email: user.email,
            })) || [];

            // Fetch pipelines
            const pipelinesResponse = await apiFetch({
                path: '/qc/v1/pipelines',
            });

            const pipelines = pipelinesResponse?.map((pipeline: any) => ({
                id: pipeline.id,
                name: pipeline.name,
            })) || [];

            // Fetch contacts
            const contactsResponse = await apiFetch({
                path: '/qc/v1/contacts',
            });

            const contacts = contactsResponse?.data?.map((contact: any) => ({
                id: contact.id,
                first_name: contact.first_name,
                last_name: contact.last_name,
            })) || [];

            setFilterOptions({
                owners,
                pipelines,
                contacts,
            });
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            dateRange: null,
            ownerId: null,
            pipelineId: null,
            status: null,
            contactId: null,
        });
    };

    // Initialize filter options on mount
    useEffect(() => {
        fetchFilterOptions();
    }, []);

    return {
        filters,
        setFilters,
        filterOptions,
        showFilters,
        setShowFilters,
        buildQueryParams,
        clearFilters,
        refreshFilterOptions: fetchFilterOptions,
    };
};
