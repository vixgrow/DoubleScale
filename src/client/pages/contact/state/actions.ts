/**
 * Internal dependencies
 */
import type { Contact, Note, AutomationContact, LMSCourse } from '@quillcrm/client';
import type { EmailAnalytics, PurchaseHistory } from './types';
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
import type {
	ContactAction,
	NoteAction,
	AutomationContactAction,
	EmailAnalyticsAction,
	PurchaseHistoryAction,
	CoursesAction
} from './types';

export default (
	dispatch: React.Dispatch<
		ContactAction | NoteAction | AutomationContactAction | EmailAnalyticsAction | PurchaseHistoryAction | CoursesAction
	>
) => {
	return {
		setContact: (contact: Contact) => {
			dispatch({
				type: SET_CONTACT,
				contact,
			});
		},
		setNotes: (notes: Note[]) => {
			dispatch({
				type: SET_NOTES,
				notes,
			});
		},
		addNote: (note: Note) => {
			dispatch({
				type: ADD_NOTE,
				note,
			});
		},
		deleteNote: (note: Note) => {
			dispatch({
				type: DELETE_NOTE,
				note,
			});
		},
		updateNote: (note: Note) => {
			dispatch({
				type: UPDATE_NOTE,
				note,
			});
		},
		setAutomationContacts: (automationContacts: AutomationContact[]) => {
			dispatch({
				type: SET_AUTOMATION_CONTACTS,
				automationContacts,
			});
		},
		setEmailAnalytics: (emailAnalytics: EmailAnalytics) => {
			dispatch({
				type: SET_EMAIL_ANALYTICS,
				emailAnalytics,
			});
		},
		setPurchaseHistory: (purchaseHistory: PurchaseHistory) => {
			dispatch({
				type: SET_PURCHASES_HISTORY,
				purchaseHistory,
			});
		},
		setCourses: (courses: LMSCourse[]) => {
			dispatch({
				type: SET_COURSES,
				courses,
			});
		},
	};
};
