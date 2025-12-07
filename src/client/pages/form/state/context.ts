/**
 * WordPress Dependencies
 */
import { createContext, useContext } from 'react';

/**
 * Internal dependencies
 */
import type { Form } from '@quillcrm/client';

export const FormContext = createContext<{
	form: Form | null;
	isLoading: boolean;
	isSaving: boolean;
	formFields: Form['fields_settings']['fields'] | null;
	navigate?: (path: string) => void;
	setForm: (form: Form) => void;
	setIsLoading: (isLoading: boolean) => void;
	setIsSaving: (isSaving: boolean) => void;
	setFormFields: (fields: Form['fields_settings']['fields'] | null) => void;
	updateForm: (payload: Partial<Form>) => void;
	saveForm: (payload?: Partial<Form>) => void;
	updateSettings: <K extends keyof Form['data']>(
		_key: K,
		_value: Form['data'][K]
	) => void;
}>({
	form: null,
	isLoading: false,
	isSaving: false,
	formFields: null,
	navigate: undefined,
	setForm: (_form: Form) => {
		throw new Error('setForm() not implemented');
	},
	setIsLoading: (_isLoading: boolean) => {
		throw new Error('setIsLoading() not implemented');
	},
	setIsSaving: (_isSaving: boolean) => {
		throw new Error('setIsSaving() not implemented');
	},
	setFormFields: (_fields: Form['fields_settings']['fields'] | null) => {
		throw new Error('setFormFields() not implemented');
	},
	updateForm: (_payload: Partial<Form>) => {
		throw new Error('updateForm() not implemented');
	},
	saveForm: (_payload?: Partial<Form>) => {
		throw new Error('saveForm() not implemented');
	},
	updateSettings: <K extends keyof Form['data']>(
		_key: K,
		_value: Form['data'][K]
	) => {
		throw new Error('updateSettings() not implemented');
	},
});

const Provider = FormContext.Provider;
const useFormContext = () => useContext(FormContext);

export { Provider, useFormContext };
