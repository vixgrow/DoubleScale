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
	SET_COURSES,
} from './constants';
import type {
	Contact,
	Note,
	AutomationContact,
	CampaignEmailsResponse,
	Order,
	EddOrder,
	SurecartOrder,
	LMSCourse,
} from '@doublescale/client';

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

export type EmailAnalytics = {
	messages: CampaignEmailsResponse; // Unified endpoint returns 'messages'
	total_sent: number;
	total_opened: number;
	total_clicked: number;
	open_rate: number; // Calculated as (total_opened / total_sent) * 100
	click_rate: number; // Calculated as (total_clicked / total_sent) * 100
	mode?: string;
} | null;

export type setEmailAnalytics = {
	type: typeof SET_EMAIL_ANALYTICS;
	emailAnalytics: EmailAnalytics;
};

export type PurchaseHistory = {
	edd: {
		orders: EddOrder[];
		total: number;
		revenue: number;
		average: number;
		last_order: string;
		currency: string;
		revenue_by_currency?: Record<string, number>;
	};
	wc: {
		orders: Order[];
		total: number;
		revenue: number;
		average: number;
		last_order: string;
		currency: string;
		revenue_by_currency?: Record<string, number>;
	};
	surecart: {
		orders: SurecartOrder[];
		total: number;
		revenue: number;
		average: number;
		last_order: string;
		currency: string;
		revenue_by_currency?: Record<string, number>;
	};
} | null;

export type setPurchaseHistory = {
	type: typeof SET_PURCHASES_HISTORY;
	purchaseHistory: PurchaseHistory;
};

export type setCourses = {
	type: typeof SET_COURSES;
	courses: LMSCourse[];
};

export type ContactAction = setContact;

export type NoteAction = setNotes | addNote | deleteNote | updateNote;

export type AutomationContactAction = setAutomationContacts;

export type EmailAnalyticsAction = setEmailAnalytics;

export type PurchaseHistoryAction = setPurchaseHistory;

export type CoursesAction = setCourses;
