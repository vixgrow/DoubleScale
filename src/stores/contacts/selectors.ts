/**
 * Internal dependencies
 */
import type { Contact, Filter as FilterType } from '@quillcrm/client';
import type { ContactsPureState, PaginationState, QueryResult } from './types';
import { generateQueryKey } from './utils';

/**
 * Get all contacts from normalized state
 */
export const getAllContacts = (state: ContactsPureState): Contact[] => {
  return Object.values(state.contacts);
};

/**
 * Get contact by ID
 */
export const getContact = (state: ContactsPureState, contactId: number): Contact | undefined => {
  return state.contacts[contactId];
};

/**
 * Get contacts based on current filters, keywords, and pagination
 */
export const getContacts = (state: ContactsPureState): Contact[] => {
  const { filters, keywords, pagination } = state;
  // Use base query key (page 1) to get the accumulated contact list for infinite scroll
  const baseQueryKey = generateQueryKey(filters, keywords, 1, pagination.perPage);
  const query = state.queries[baseQueryKey];

  if (!query) {
    return [];
  }

  return query.contacts
    .map(id => state.contacts[id])
    .filter(Boolean); // Remove any undefined contacts
};

/**
 * Get contacts for a specific query
 */
export const getContactsByQuery = (
  state: ContactsPureState,
  filters: FilterType[],
  keywords: string,
  page: number,
  perPage: number
): Contact[] => {
  const queryKey = generateQueryKey(filters, keywords, page, perPage);
  const query = state.queries[queryKey];

  if (!query) {
    return [];
  }

  return query.contacts
    .map(id => state.contacts[id])
    .filter(Boolean);
};

/**
 * Get current filters
 */
export const getFilters = (state: ContactsPureState): FilterType[] => {
  return state.filters;
};

/**
 * Get current pagination
 */
export const getPagination = (state: ContactsPureState): PaginationState => {
  return state.pagination;
};

/**
 * Get current search keywords
 */
export const getSearchKeywords = (state: ContactsPureState): string => {
  return state.keywords;
};

/**
 * Get selected contact IDs
 */
export const getSelectedIds = (state: ContactsPureState): number[] => {
  return state.selectedIds;
};

/**
 * Get selected contacts
 */
export const getSelectedContacts = (state: ContactsPureState): Contact[] => {
  return state.selectedIds
    .map(id => state.contacts[id])
    .filter(Boolean);
};

/**
 * Get total contacts count for current query
 */
export const getContactsTotal = (state: ContactsPureState): number => {
  const { filters, keywords, pagination } = state;
  const queryKey = generateQueryKey(filters, keywords, pagination.page, pagination.perPage);
  const query = state.queries[queryKey];

  return query?.total || state.pagination.total || 0;
};

/**
 * Get loading states
 */
export const isLoadingContacts = (state: ContactsPureState): boolean => {
  return state.loading.fetchingContacts;
};

export const isLoadingContact = (state: ContactsPureState): boolean => {
  return state.loading.fetchingContact;
};

export const isCreatingContact = (state: ContactsPureState): boolean => {
  return state.loading.creatingContact;
};

export const isUpdatingContact = (state: ContactsPureState): boolean => {
  return state.loading.updatingContact;
};

export const isDeletingContacts = (state: ContactsPureState): boolean => {
  return state.loading.deletingContacts;
};

/**
 * Get error for a specific operation
 */
export const getError = (state: ContactsPureState, errorKey: string): string => {
  return state.errors[errorKey] || '';
};

/**
 * Get contacts error for current query
 */
export const getContactsError = (state: ContactsPureState): string => {
  const { filters, keywords, pagination } = state;
  const queryKey = generateQueryKey(filters, keywords, pagination.page, pagination.perPage);
  return state.errors[queryKey] || '';
};

/**
 * Check if a query is cached and fresh
 */
export const isQueryCached = (
  state: ContactsPureState,
  filters: FilterType[],
  keywords: string,
  page: number,
  perPage: number,
  maxAge: number = 60000 // 1 minute default
): boolean => {
  const queryKey = generateQueryKey(filters, keywords, page, perPage);
  const query = state.queries[queryKey];

  if (!query) {
    return false;
  }

  return Date.now() - query.lastFetch < maxAge;
};

/**
 * Get query cache
 */
export const getQueryCache = (state: ContactsPureState, queryKey: string): QueryResult | undefined => {
  return state.queries[queryKey];
};

/**
 * Check if there are more pages available
 */
export const hasMorePages = (state: ContactsPureState): boolean => {
  const { pagination } = state;
  return pagination.page < pagination.totalPages;
};

/**
 * Check if we're on the first page
 */
export const isFirstPage = (state: ContactsPureState): boolean => {
  return state.pagination.page === 1;
};

/**
 * Check if we're on the last page
 */
export const isLastPage = (state: ContactsPureState): boolean => {
  const { pagination } = state;
  return pagination.page >= pagination.totalPages;
};

/**
 * Get contacts count per page
 */
export const getContactsPerPage = (state: ContactsPureState): number => {
  return state.pagination.perPage;
};

/**
 * Get current page number
 */
export const getCurrentPage = (state: ContactsPureState): number => {
  return state.pagination.page;
};

/**
 * Get total pages count
 */
export const getTotalPages = (state: ContactsPureState): number => {
  return state.pagination.totalPages;
};

/**
 * Get full contacts state (for actions that need access to state)
 */
export const getContactsState = (state: ContactsPureState): ContactsPureState => {
  return state;
};

/**
 * Check if there are more contacts to load
 */
export const hasMoreContacts = (state: ContactsPureState): boolean => {
  const { pagination } = state;
  return pagination.page < pagination.totalPages;
};
