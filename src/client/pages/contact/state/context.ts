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
	NoticeMessage,
} from '@doublescale/client';
import type { EmailAnalytics, PurchaseHistory } from './types';

/**
 * Context type definition for contact page state.
 * Shared between free and Pro plugin bundles via window.doublescale.contexts.
 */
export type ContactContextType = {
	contact: Contact | null;
	isLoading: boolean;
	setContact: (contact: Contact) => void;
	updateContact: (updatedData?: Partial<Contact>) => void;
	isUpdating: boolean;
	showNotice?: (notice: NoticeMessage) => void;
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
};

const defaultContextValue: ContactContextType = {
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
};

// Extend Window interface for TypeScript.
declare global {
	interface Window {
		doublescale?: {
			config?: unknown;
			contexts?: {
				ContactContext?: React.Context<ContactContextType>;
			};
		};
	}
}

/**
 * Get or create the ContactContext singleton.
 * This ensures both free and Pro plugin bundles share the same context instance.
 * Without this, each webpack bundle would create its own context via createContext(),
 * causing the Pro plugin's useContactContext() to return defaults instead of Provider values.
 */
function getContactContext(): React.Context<ContactContextType> {
	// Ensure window.doublescale.contexts exists.
	if (!window.doublescale) {
		window.doublescale = {};
	}
	if (!window.doublescale.contexts) {
		window.doublescale.contexts = {};
	}

	// Return existing context if already created (by free plugin).
	if (window.doublescale.contexts.ContactContext) {
		return window.doublescale.contexts.ContactContext;
	}

	// Create and store the context singleton.
	const context = createContext<ContactContextType>(defaultContextValue);
	window.doublescale.contexts.ContactContext = context;
	return context;
}

export const ContactContext = getContactContext();

const Provider = ContactContext.Provider;
const useContactContext = () => useContext(ContactContext);

export { Provider, useContactContext };
