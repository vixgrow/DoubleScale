/**
 * Internal dependencies
 */
import { SET_FORM, UPDATE_FORM, UPDATE_SETTINGS } from './constants';
import type { Form } from '@quillcrm/client';

export type setForm = {
	type: typeof SET_FORM;
	form: Form;
};

export type updateForm = {
	type: typeof UPDATE_FORM;
	payload: Partial<Form>;
};

export type updateSettings = {
	type: typeof UPDATE_SETTINGS;
	key: keyof Form['data'];
	value: Form['data'][keyof Form['data']];
};

export type FormAction = setForm | updateForm | updateSettings;
