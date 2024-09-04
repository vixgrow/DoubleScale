/**
 * WordPress Dependencies
 */
import { createContext, useContext } from 'react';

/**
 * Internal dependencies
 */
import { Form } from '@quillcrm/client';

export const FormContext = createContext<{
	form: Form | null;
	isLoading: boolean;
	isSaving: boolean;
	setForm: (form: Form) => void;
	setIsLoading: (isLoading: boolean) => void;
	setIsSaving: (isSaving: boolean) => void;
	updateForm: (payload: { [key: string]: any }) => void;
	saveForm: (payload?: { [key: string]: any }) => void;
	updateSettings: (key: string, value: any) => void;
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
	updateForm: (_payload: { [key: string]: any }) => {
		throw new Error('updateForm() not implemented');
	},
	saveForm: (_payload?: { [key: string]: any }) => {
		throw new Error('saveForm() not implemented');
	},
	updateSettings: (_key: string, _value: any) => {
		throw new Error('updateSettings() not implemented');
	},
});

const Provider = FormContext.Provider;
const useFormContext = () => useContext(FormContext);

export { Provider, useFormContext };
