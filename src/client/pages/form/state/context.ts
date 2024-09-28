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
	setForm: (form: Form) => void;
	setIsLoading: (isLoading: boolean) => void;
	setIsSaving: (isSaving: boolean) => void;
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
	setForm: (_form: Form) => {
		throw new Error('setForm() not implemented');
	},
	setIsLoading: (_isLoading: boolean) => {
		throw new Error('setIsLoading() not implemented');
	},
	setIsSaving: (_isSaving: boolean) => {
		throw new Error('setIsSaving() not implemented');
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
