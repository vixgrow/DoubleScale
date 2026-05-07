/**
 * WordPress Dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * External dependencies
 */
import type { Reducer } from 'redux';

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
	SET_EMAIL_ANALYTICS,
	SET_PURCHASES_HISTORY,
	SET_COURSES
} from './constants';
import type { EmailAnalytics, PurchaseHistory } from './types';
import type { Contact, Note, AutomationContact, LMSCourse } from '@doublescale/client';
import type {
	ContactAction,
	NoteAction,
	AutomationContactAction,
	EmailAnalyticsAction,
	PurchaseHistoryAction,
	CoursesAction
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
			return state.map((note) =>
				note.id === action.note.id ? action.note : note
			);
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

const emailAnalytics: Reducer<EmailAnalytics | null, EmailAnalyticsAction> = (state = null, action) => {
	switch (action.type) {
		case SET_EMAIL_ANALYTICS:
			return action.emailAnalytics;
		default:
			return state;
	}
};

const purchaseHistory: Reducer<PurchaseHistory | null, PurchaseHistoryAction> = (state = null, action) => {
	switch (action.type) {
		case SET_PURCHASES_HISTORY:
			return action.purchaseHistory;
		default:
			return state;
	}
};

const courses: Reducer<LMSCourse[], CoursesAction> = (state = [], action) => {
	switch (action.type) {
		case SET_COURSES:
			return action.courses;
		default:
			return state;
	}
};

const CombinedReducer = combineReducers({
	contact,
	notes,
	automationContacts,
	emailAnalytics,
	purchaseHistory,
	courses
});
export type State = ReturnType<typeof CombinedReducer>;
export default CombinedReducer;
