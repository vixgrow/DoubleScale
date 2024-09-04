/**
 * WordPress Dependencies
 */
import { createContext, useContext } from 'react';

/**
 * Internal dependencies
 */
import { Contact, Note, AutomationContact } from '@quillcrm/client';

export const ContactContext = createContext<{
	contact: Contact | null;
	isLoading: boolean;
	setContact: (contact: Contact) => void;
	updateContact: () => void;
	isUpdating: boolean;
	notes: Note[];
	setNotes: (notes: Note[]) => void;
	addNote: (note: Note) => void;
	deleteNote: (note: Note) => void;
	updateNote: (note: Note) => void;
	automationContacts: AutomationContact[];
	setAutomationContacts: (automationContacts: AutomationContact[]) => void;
}>({
	contact: null,
	isLoading: false,
	isUpdating: false,
	setContact: (_contact: Contact) => {
		throw new Error('setContact() not implemented');
	},
	updateContact: () => {
		throw new Error('updateContact() not implemented');
	},
	notes: [],
	setNotes: (_notes: Note[]) => {
		throw new Error('setNotes() not implemented');
	},
	addNote: (_note: Note) => {
		throw new Error('addNote() not implemented');
	},
	deleteNote: (_note: Note) => {
		throw new Error('deleteNote() not implemented');
	},
	updateNote: (_note: Note) => {
		throw new Error('updateNote() not implemented');
	},
	automationContacts: [],
	setAutomationContacts: (_automationContacts: AutomationContact[]) => {
		throw new Error('setAutomationContacts() not implemented');
	},
});

const Provider = ContactContext.Provider;
const useContactContext = () => useContext(ContactContext);

export { Provider, useContactContext };
