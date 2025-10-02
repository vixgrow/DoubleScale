/**
 * WordPress Dependencies
 */
import { createContext, useContext } from 'react';

/**
 * Internal dependencies
 */
import type {
	Contact,
	Note,
	AutomationContact,
	LMSCourse,
} from '@quillcrm/client';
import type { EmailAnalytics, PurchaseHistory } from './types';

export const ContactContext = createContext<{
	contact: Contact | null;
	isLoading: boolean;
	setContact: (contact: Contact) => void;
	updateContact: (updatedData?: Partial<Contact>) => void;
	isUpdating: boolean;
	notes: Note[];
	setNotes: (notes: Note[]) => void;
	addNote: (note: Note) => void;
	deleteNote: (note: Note) => void;
	updateNote: (note: Note) => void;
	automationContacts: AutomationContact[];
	setAutomationContacts: (automationContacts: AutomationContact[]) => void;
	emailAnalytics: EmailAnalytics;
	setEmailAnalytics: (emailAnalytics: EmailAnalytics) => void;
	purchaseHistory: PurchaseHistory;
	setPurchaseHistory: (purchaseHistory: PurchaseHistory) => void;
	courses: LMSCourse[];
	setCourses: (courses: LMSCourse[]) => void;
}>({
	contact: null,
	isLoading: false,
	isUpdating: false,
	setContact: (_contact: Contact) => {
		throw new Error('setContact() not implemented');
	},
	updateContact: (_updatedData?: Partial<Contact>) => {
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
	emailAnalytics: null,
	setEmailAnalytics: (_emailAnalytics: EmailAnalytics) => {
		throw new Error('setEmailAnalytics() not implemented');
	},
	purchaseHistory: null,
	setPurchaseHistory: (_purchaseHistory: PurchaseHistory) => {
		throw new Error('setPurchaseHistory() not implemented');
	},
	courses: [],
	setCourses: (_courses: LMSCourse[]) => {
		throw new Error('setCourses() not implemented');
	},
});

const Provider = ContactContext.Provider;
const useContactContext = () => useContext(ContactContext);

export { Provider, useContactContext };
