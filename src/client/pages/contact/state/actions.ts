/**
 * Internal dependencies
 */
import type { Contact, Note, AutomationContact } from '@quillcrm/client';
import {
	SET_CONTACT,
	SET_NOTES,
	ADD_NOTE,
	DELETE_NOTE,
	UPDATE_NOTE,
	SET_AUTOMATION_CONTACTS,
} from './constants';
import type {
	ContactAction,
	NoteAction,
	AutomationContactAction,
} from './types';

export default (
	dispatch: React.Dispatch<
		ContactAction | NoteAction | AutomationContactAction
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
	};
};
