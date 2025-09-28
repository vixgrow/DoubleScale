/**
 * External Dependencies.
 */
import type { FunctionKeys } from 'utility-types';

/**
 * Internal Dependencies.
 */
import type { Contact, Filter as FilterType } from '@quillcrm/client';
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
  SET_QUERY_CACHE,
  SET_SEARCH_KEYWORDS,
  SET_SELECTED_IDS,
  UPDATE_CONTACT_ERROR,
  UPDATE_CONTACT_START,
  UPDATE_CONTACT_SUCCESS,
} from './constants';

// State Types
export interface PaginationState {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface LoadingState {
  fetchingContacts: boolean;
  fetchingContact: boolean;
  creatingContact: boolean;
  updatingContact: boolean;
  deletingContacts: boolean;
}

export interface QueryResult {
  contacts: number[]; // Contact IDs
  total: number;
  lastFetch: number;
  filters: FilterType[];
  keywords: string;
  pagination: PaginationState;
}

export interface ContactsPureState {
  // Normalized data
  contacts: Record<number, Contact>;

  // UI State
  filters: FilterType[];
  pagination: PaginationState;
  keywords: string;
  selectedIds: number[];

  // Loading states
  loading: LoadingState;

  // Cache
  queries: Record<string, QueryResult>;

  // Error handling
  errors: Record<string, string>;
}

// Action Types
export interface FetchContactsStartAction {
  type: typeof FETCH_CONTACTS_START;
  queryKey: string;
}

export interface FetchContactsSuccessAction {
  type: typeof FETCH_CONTACTS_SUCCESS;
  queryKey: string;
  contacts: Contact[];
  total: number;
  filters: FilterType[];
  keywords: string;
  pagination: PaginationState;
}

export interface FetchContactsErrorAction {
  type: typeof FETCH_CONTACTS_ERROR;
  queryKey: string;
  error: string;
}

export interface FetchContactStartAction {
  type: typeof FETCH_CONTACT_START;
  contactId: number;
}

export interface FetchContactSuccessAction {
  type: typeof FETCH_CONTACT_SUCCESS;
  contact: Contact;
}

export interface FetchContactErrorAction {
  type: typeof FETCH_CONTACT_ERROR;
  contactId: number;
  error: string;
}

export interface CreateContactStartAction {
  type: typeof CREATE_CONTACT_START;
}

export interface CreateContactSuccessAction {
  type: typeof CREATE_CONTACT_SUCCESS;
  contact: Contact;
}

export interface CreateContactErrorAction {
  type: typeof CREATE_CONTACT_ERROR;
  error: string;
}

export interface UpdateContactStartAction {
  type: typeof UPDATE_CONTACT_START;
  contactId: number;
}

export interface UpdateContactSuccessAction {
  type: typeof UPDATE_CONTACT_SUCCESS;
  contact: Contact;
}

export interface UpdateContactErrorAction {
  type: typeof UPDATE_CONTACT_ERROR;
  contactId: number;
  error: string;
}

export interface DeleteContactsStartAction {
  type: typeof DELETE_CONTACTS_START;
  contactIds: number[];
}

export interface DeleteContactsSuccessAction {
  type: typeof DELETE_CONTACTS_SUCCESS;
  contactIds: number[];
}

export interface DeleteContactsErrorAction {
  type: typeof DELETE_CONTACTS_ERROR;
  contactIds: number[];
  error: string;
}

export interface SetFiltersAction {
  type: typeof SET_FILTERS;
  filters: FilterType[];
}

export interface SetPaginationAction {
  type: typeof SET_PAGINATION;
  pagination: Partial<PaginationState>;
}

export interface SetSearchKeywordsAction {
  type: typeof SET_SEARCH_KEYWORDS;
  keywords: string;
}

export interface SetSelectedIdsAction {
  type: typeof SET_SELECTED_IDS;
  ids: number[];
}

export interface ClearSelectedIdsAction {
  type: typeof CLEAR_SELECTED_IDS;
}

export interface InvalidateQueryAction {
  type: typeof INVALIDATE_QUERY;
  queryKey?: string;
}

export interface SetQueryCacheAction {
  type: typeof SET_QUERY_CACHE;
  queryKey: string;
  result: QueryResult;
}

export type ContactsActionTypes =
  | FetchContactsStartAction
  | FetchContactsSuccessAction
  | FetchContactsErrorAction
  | FetchContactStartAction
  | FetchContactSuccessAction
  | FetchContactErrorAction
  | CreateContactStartAction
  | CreateContactSuccessAction
  | CreateContactErrorAction
  | UpdateContactStartAction
  | UpdateContactSuccessAction
  | UpdateContactErrorAction
  | DeleteContactsStartAction
  | DeleteContactsSuccessAction
  | DeleteContactsErrorAction
  | SetFiltersAction
  | SetPaginationAction
  | SetSearchKeywordsAction
  | SetSelectedIdsAction
  | ClearSelectedIdsAction
  | InvalidateQueryAction
  | SetQueryCacheAction;

// Helper types for store
export type DispatchFromMap<T extends Record<string, any>> = {
  [K in FunctionKeys<T>]: T[K] extends (...args: any[]) => any
  ? T[K]
  : never;
};

export type SelectFromMap<T extends Record<string, any>> = {
  [K in FunctionKeys<T>]: T[K] extends (...args: any[]) => any
  ? T[K]
  : never;
};