/**
 * Internal dependencies
 */
import type { Form } from '@doublescale/client';
import { SET_FORM, UPDATE_FORM, UPDATE_SETTINGS } from './constants';
import type { FormAction } from './types';

export default (dispatch: React.Dispatch<FormAction>) => {
	return {
		setForm: (form: Form) => {
			dispatch({
				type: SET_FORM,
				form,
			});
		},
		updateForm: (payload: Partial<Form>) => {
			dispatch({
				type: UPDATE_FORM,
				payload,
			});
		},
		updateSettings: <K extends keyof Form['data']>(
			key: K,
			value: Form['data'][K]
		) => {
			dispatch({
				type: UPDATE_SETTINGS,
				key,
				value,
			});
		},
	};
};
