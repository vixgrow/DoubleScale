/**
 * External dependencies
 */
import { cloneDeep, keyBy } from 'lodash';
import type { Reducer } from 'redux';

/**
 * Internal Dependencies.
 */
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
import { ContactsActionTypes, ContactsPureState } from './types';

// Initial State
const initialState: ContactsPureState = {
  contacts: {},
  filters: [],
  pagination: {
    page: 1,
    perPage: 50,
    total: 0,
    totalPages: 0,
  },
  keywords: '',
  selectedIds: [],
  loading: {
    fetchingContacts: false,
    fetchingContact: false,
    creatingContact: false,
    updatingContact: false,
    deletingContacts: false,
  },
  queries: {},
  errors: {},
};


/**
 * Reducer returning the contacts data object.
 */
const reducer: Reducer<ContactsPureState, ContactsActionTypes> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case FETCH_CONTACTS_START: {
      return {
        ...state,
        loading: {
          ...state.loading,
          fetchingContacts: true,
        },
        errors: {
          ...state.errors,
          [action.queryKey]: '',
        },
      };
    }

    case FETCH_CONTACTS_SUCCESS: {
      const { contacts, total, filters, keywords, pagination, queryKey } = action;

      // Normalize contacts data
      const normalizedContacts = keyBy(contacts, 'id');

      // Calculate total pages
      const totalPages = Math.ceil(total / pagination.perPage);

      // For infinite scroll, we need to generate a base query key (page 1) to track the main list
      const baseQueryKey = JSON.stringify({ filters, keywords, page: 1, perPage: pagination.perPage });
      const existingQuery = state.queries[baseQueryKey];

      // Determine if this is loading more contacts (page > 1) or a fresh load
      const isLoadingMore = pagination.page > 1;

      return {
        ...state,
        contacts: {
          ...state.contacts,
          ...normalizedContacts,
        },
        filters,
        keywords,
        pagination: {
          ...pagination,
          total,
          totalPages,
        },
        loading: {
          ...state.loading,
          fetchingContacts: false,
        },
        queries: {
          ...state.queries,
          [baseQueryKey]: {
            contacts: isLoadingMore && existingQuery
              ? [...existingQuery.contacts, ...contacts.map(c => c.id)]
              : contacts.map(c => c.id),
            total,
            lastFetch: Date.now(),
            filters,
            keywords,
            pagination: { ...pagination, total, totalPages },
          },
        },
        errors: {
          ...state.errors,
          [queryKey]: '',
        },
      };
    }

    case FETCH_CONTACTS_ERROR: {
      return {
        ...state,
        loading: {
          ...state.loading,
          fetchingContacts: false,
        },
        errors: {
          ...state.errors,
          [action.queryKey]: action.error,
        },
      };
    }

    case FETCH_CONTACT_START: {
      return {
        ...state,
        loading: {
          ...state.loading,
          fetchingContact: true,
        },
        errors: {
          ...state.errors,
          [`contact_${action.contactId}`]: '',
        },
      };
    }

    case FETCH_CONTACT_SUCCESS: {
      return {
        ...state,
        contacts: {
          ...state.contacts,
          [action.contact.id]: action.contact,
        },
        loading: {
          ...state.loading,
          fetchingContact: false,
        },
      };
    }

    case FETCH_CONTACT_ERROR: {
      return {
        ...state,
        loading: {
          ...state.loading,
          fetchingContact: false,
        },
        errors: {
          ...state.errors,
          [`contact_${action.contactId}`]: action.error,
        },
      };
    }

    case CREATE_CONTACT_START: {
      return {
        ...state,
        loading: {
          ...state.loading,
          creatingContact: true,
        },
        errors: {
          ...state.errors,
          createContact: '',
        },
      };
    }

    case CREATE_CONTACT_SUCCESS: {
      return {
        ...state,
        contacts: {
          ...state.contacts,
          [action.contact.id]: action.contact,
        },
        loading: {
          ...state.loading,
          creatingContact: false,
        },
        // Invalidate all queries since we have new data
        queries: {},
      };
    }

    case CREATE_CONTACT_ERROR: {
      return {
        ...state,
        loading: {
          ...state.loading,
          creatingContact: false,
        },
        errors: {
          ...state.errors,
          createContact: action.error,
        },
      };
    }

    case UPDATE_CONTACT_START: {
      return {
        ...state,
        loading: {
          ...state.loading,
          updatingContact: true,
        },
        errors: {
          ...state.errors,
          [`updateContact_${action.contactId}`]: '',
        },
      };
    }

    case UPDATE_CONTACT_SUCCESS: {
      return {
        ...state,
        contacts: {
          ...state.contacts,
          [action.contact.id]: action.contact,
        },
        loading: {
          ...state.loading,
          updatingContact: false,
        },
        // Invalidate all queries since data changed
        queries: {},
      };
    }

    case UPDATE_CONTACT_ERROR: {
      return {
        ...state,
        loading: {
          ...state.loading,
          updatingContact: false,
        },
        errors: {
          ...state.errors,
          [`updateContact_${action.contactId}`]: action.error,
        },
      };
    }

    case DELETE_CONTACTS_START: {
      return {
        ...state,
        loading: {
          ...state.loading,
          deletingContacts: true,
        },
        errors: {
          ...state.errors,
          deleteContacts: '',
        },
      };
    }

    case DELETE_CONTACTS_SUCCESS: {
      const updatedContacts = cloneDeep(state.contacts);
      action.contactIds.forEach(id => {
        delete updatedContacts[id];
      });

      return {
        ...state,
        contacts: updatedContacts,
        selectedIds: state.selectedIds.filter(
          id => !action.contactIds.includes(id)
        ),
        loading: {
          ...state.loading,
          deletingContacts: false,
        },
        // Invalidate all queries since data changed
        queries: {},
      };
    }

    case DELETE_CONTACTS_ERROR: {
      return {
        ...state,
        loading: {
          ...state.loading,
          deletingContacts: false,
        },
        errors: {
          ...state.errors,
          deleteContacts: action.error,
        },
      };
    }

    case SET_FILTERS: {
      return {
        ...state,
        filters: action.filters,
        pagination: {
          ...state.pagination,
          page: 1, // Reset to first page when filters change
        },
      };
    }

    case SET_PAGINATION: {
      return {
        ...state,
        pagination: {
          ...state.pagination,
          ...action.pagination,
        },
      };
    }

    case SET_SEARCH_KEYWORDS: {
      return {
        ...state,
        keywords: action.keywords,
        pagination: {
          ...state.pagination,
          page: 1, // Reset to first page when search changes
        },
      };
    }

    case SET_SELECTED_IDS: {
      return {
        ...state,
        selectedIds: action.ids,
      };
    }

    case CLEAR_SELECTED_IDS: {
      return {
        ...state,
        selectedIds: [],
      };
    }

    case INVALIDATE_QUERY: {
      if (action.queryKey) {
        const updatedQueries = cloneDeep(state.queries);
        delete updatedQueries[action.queryKey];
        return {
          ...state,
          queries: updatedQueries,
        };
      }
      // Invalidate all queries
      return {
        ...state,
        queries: {},
      };
    }

    case SET_QUERY_CACHE: {
      return {
        ...state,
        queries: {
          ...state.queries,
          [action.queryKey]: action.result,
        },
      };
    }

    default:
      return state;
  }
};

export type State = ReturnType<typeof reducer>;
export default reducer;
