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

export type setContact = {
	type: typeof SET_CONTACT;
	contact: Contact;
};

export type setNotes = {
	type: typeof SET_NOTES;
	notes: Note[];
};

export type addNote = {
	type: typeof ADD_NOTE;
	note: Note;
};

export type deleteNote = {
	type: typeof DELETE_NOTE;
	note: Note;
};

export type updateNote = {
	type: typeof UPDATE_NOTE;
	note: Note;
};

export type setAutomationContacts = {
	type: typeof SET_AUTOMATION_CONTACTS;
	automationContacts: AutomationContact[];
};

export type ContactAction = setContact;

export type NoteAction = setNotes | addNote | deleteNote | updateNote;

export type AutomationContactAction = setAutomationContacts;
