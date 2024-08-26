/**
 * Internal dependencies
 */
import type { Form } from '../../types';
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
		updateForm: (payload: Record<string, any>) => {
			dispatch({
				type: UPDATE_FORM,
				payload,
			});
		},
		updateSettings: (key: string, value: any) => {
			dispatch({
				type: UPDATE_SETTINGS,
				key,
				value,
			});
		},
	};
};
