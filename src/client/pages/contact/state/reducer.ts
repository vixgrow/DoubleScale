/**
 * WordPress Dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * External dependencies
 */
import type { Reducer } from 'redux';
import { omit } from 'lodash';

/**
 * Internal dependencies
 */
import {
	SET_CONTACT,
	SET_NOTES,
	ADD_NOTE,
	DELETE_NOTE,
	UPDATE_NOTE,
	SET_AUTOMATION_CONTACTS,
} from './constants';

import type { Contact, Note, AutomationContact } from '../../types';

import type {
	ContactAction,
	NoteAction,
	AutomationContactAction,
} from './types';

const contact: Reducer<Contact | null, ContactAction> = (
	state = null,
	action
) => {
	switch (action.type) {
		case SET_CONTACT:
			return action.contact;
		default:
			return state;
	}
};

const notes: Reducer<Note[], NoteAction> = (state = [], action) => {
	switch (action.type) {
		case SET_NOTES:
			return action.notes;
		case ADD_NOTE:
			return [...state, action.note];
		case DELETE_NOTE:
			return state.filter((note) => note.id !== action.note.id);
		case UPDATE_NOTE:
			return omit(state, action.note.id);
		default:
			return state;
	}
};

const automationContacts: Reducer<
	AutomationContact[],
	AutomationContactAction
> = (state = [], action) => {
	switch (action.type) {
		case SET_AUTOMATION_CONTACTS:
			return action.automationContacts;
		default:
			return state;
	}
};

const CombinedReducer = combineReducers({
	contact,
	notes,
	automationContacts,
});
export type State = ReturnType<typeof CombinedReducer>;
export default CombinedReducer;
