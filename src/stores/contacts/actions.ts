/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import type { Contact, ContactsResponse, Filter as FilterType } from '@quillcrm/client';
import {
  CLEAR_SELECTED_IDS,
  CREATE_CONTACT_ERROR,
  CREATE_CONTACT_START,
  CREATE_CONTACT_SUCCESS,
  DELETE_CONTACTS_ERROR,
  DELETE_CONTACTS_START,
  DELETE_CONTACTS_SUCCESS,
  FETCH_CONTACTS_ERROR,
  FETCH_CONTACTS_START,
  FETCH_CONTACTS_SUCCESS,
  FETCH_CONTACT_ERROR,
  FETCH_CONTACT_START,
  FETCH_CONTACT_SUCCESS,
  INVALIDATE_QUERY,
  SET_FILTERS,
  SET_PAGINATION,
  SET_SEARCH_KEYWORDS,
  SET_SELECTED_IDS,
  UPDATE_CONTACT_ERROR,
  UPDATE_CONTACT_START,
  UPDATE_CONTACT_SUCCESS,
} from './constants';
import type { PaginationState } from './types';

/**
 * Generate a query key for caching
 */
const generateQueryKey = (
  filters: FilterType[],
  keywords: string,
  page: number,
  perPage: number
): string => {
  return JSON.stringify({ filters, keywords, page, perPage });
};

/**
 * Fetch contacts with optional filters, keywords, and pagination
 */
export const fetchContacts = (options: {
  filters?: FilterType[];
  keywords?: string;
  page?: number;
  perPage?: number;
  subscribed?: boolean;
  forceRefresh?: boolean;
} = {}) => async ({ select, dispatch }: any) => {
  const {
    filters = [],
    keywords = '',
    page = 1,
    perPage = 50,
    subscribed = true,
    forceRefresh = false,
  } = options;

  const queryKey = generateQueryKey(filters, keywords, page, perPage);

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cachedQuery = select.getQueryCache(queryKey);
    if (cachedQuery && Date.now() - cachedQuery.lastFetch < 60000) { // 1 minute cache
      return cachedQuery;
    }
  }

  dispatch({
    type: FETCH_CONTACTS_START,
    queryKey,
  });

  try {
    const response = (await apiFetch({
      path: addQueryArgs('/qc/v1/contacts', {
        per_page: perPage,
        page,
        filters,
        subscribed,
        keywords,
      }),
      method: 'GET',
      parse: true,
    })) as ContactsResponse;

    const pagination: PaginationState = {
      page,
      perPage,
      total: response.total,
      totalPages: Math.ceil(response.total / perPage),
    };

    dispatch({
      type: FETCH_CONTACTS_SUCCESS,
      queryKey,
      contacts: response.data || [],
      total: response.total,
      filters,
      keywords,
      pagination,
    });

    return {
      contacts: response.data || [],
      total: response.total,
      pagination,
    };
  } catch (error: any) {
    dispatch({
      type: FETCH_CONTACTS_ERROR,
      queryKey,
      error: error.message || 'Failed to fetch contacts',
    });
    throw error;
  }
};

/**
 * Fetch a single contact by ID
 */
export const fetchContact = (contactId: number) => async ({ dispatch }: any) => {
  dispatch({
    type: FETCH_CONTACT_START,
    contactId,
  });

  try {
    const contact = (await apiFetch({
      path: `/qc/v1/contacts/${contactId}`,
      method: 'GET',
    })) as Contact;

    dispatch({
      type: FETCH_CONTACT_SUCCESS,
      contact,
    });

    return contact;
  } catch (error: any) {
    dispatch({
      type: FETCH_CONTACT_ERROR,
      contactId,
      error: error.message || 'Failed to fetch contact',
    });
    throw error;
  }
};

/**
 * Create a new contact
 */
export const createContact = (contactData: Partial<Contact>) => async ({ dispatch }: any) => {
  dispatch({
    type: CREATE_CONTACT_START,
  });

  try {
    const contact = (await apiFetch({
      path: '/qc/v1/contacts',
      method: 'POST',
      data: contactData,
    })) as Contact;

    dispatch({
      type: CREATE_CONTACT_SUCCESS,
      contact,
    });

    return contact;
  } catch (error: any) {
    dispatch({
      type: CREATE_CONTACT_ERROR,
      error: error.message || 'Failed to create contact',
    });
    throw error;
  }
};

/**
 * Update an existing contact
 */
export const updateContact = (contactId: number, contactData: Partial<Contact>) => async ({ dispatch }: any) => {
  dispatch({
    type: UPDATE_CONTACT_START,
    contactId,
  });

  try {
    const contact = (await apiFetch({
      path: `/qc/v1/contacts/${contactId}`,
      method: 'PUT',
      data: contactData,
    })) as Contact;

    dispatch({
      type: UPDATE_CONTACT_SUCCESS,
      contact,
    });

    return contact;
  } catch (error: any) {
    dispatch({
      type: UPDATE_CONTACT_ERROR,
      contactId,
      error: error.message || 'Failed to update contact',
    });
    throw error;
  }
};

/**
 * Delete multiple contacts
 */
export const deleteContacts = (contactIds: number[]) => async ({ dispatch }: any) => {
  dispatch({
    type: DELETE_CONTACTS_START,
    contactIds,
  });

  try {
    await apiFetch({
      path: '/qc/v1/contacts/bulk-delete',
      method: 'DELETE',
      data: { ids: contactIds },
    });

    dispatch({
      type: DELETE_CONTACTS_SUCCESS,
      contactIds,
    });

    return contactIds;
  } catch (error: any) {
    dispatch({
      type: DELETE_CONTACTS_ERROR,
      contactIds,
      error: error.message || 'Failed to delete contacts',
    });
    throw error;
  }
};

/**
 * Set filters
 */
export const setFilters = (filters: FilterType[]) => ({
  type: SET_FILTERS,
  filters,
});

/**
 * Set pagination
 */
export const setPagination = (pagination: Partial<PaginationState>) => ({
  type: SET_PAGINATION,
  pagination,
});

/**
 * Set search keywords
 */
export const setSearchKeywords = (keywords: string) => ({
  type: SET_SEARCH_KEYWORDS,
  keywords,
});

/**
 * Set selected contact IDs
 */
export const setSelectedIds = (ids: number[]) => ({
  type: SET_SELECTED_IDS,
  ids,
});

/**
 * Clear selected contact IDs
 */
export const clearSelectedIds = () => ({
  type: CLEAR_SELECTED_IDS,
});

/**
 * Invalidate query cache
 */
export const invalidateQuery = (queryKey?: string) => ({
  type: INVALIDATE_QUERY,
  queryKey,
});

/**
 * Invalidate all queries (useful after mutations)
 */
export const invalidateAllQueries = () => ({
  type: INVALIDATE_QUERY,
});

/**
 * Load more contacts for infinite scroll
 */
export const loadMoreContacts = (options: {
  filters?: FilterType[];
  keywords?: string;
  subscribed?: boolean;
} = {}) => async ({ select, dispatch }: any) => {
  const state = select.getContactsState();
  const { pagination } = state;
  
  // Don't load if already loading or no more pages
  if (state.loading.fetchingContacts || pagination.page >= pagination.totalPages) {
    return;
  }

  const nextPage = pagination.page + 1;
  
  // Use existing fetchContacts but with next page
  return dispatch.fetchContacts({
    ...options,
    page: nextPage,
    perPage: pagination.perPage,
    forceRefresh: true, // Don't use cache for pagination
  });
};
