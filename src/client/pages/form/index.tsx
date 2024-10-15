/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { useReducer, useRef } from 'react';
import { useNavigate, useParams, getToLink } from '@quillcrm/navigation';
import { Tabs } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { Provider } from './state/context';
import reducer, { State } from './state/reducer';
import actions from './state/actions';
import { Form as FormType } from '@quillcrm/client';
import InitialStep from './steps/initial';
import SettingsStep from './steps/settings';
import Overview from './overview';

const Form: React.FC = () => {
	const { id, tab } = useParams<{ id: string; tab: string }>();
	const [state, dispatch] = useReducer(reducer, {
		form: null,
	} as State);
	const stateRef = useRef<State>(state);
	stateRef.current = state;
	const $actions = actions(dispatch);
	const { setForm } = $actions;
	const { form } = state;
	const [loading, setLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const navigate = useNavigate();
	const { createNotice } = useDispatch('quillcrm/core');

	useEffect(() => {
		fetchForm();
	}, [id]);

	const fetchForm = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/forms/${id}`,
			})) as FormType;

			setForm(prepareForm(response));
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	const saveForm = async (data: Partial<FormType> = {}) => {
		setIsSaving(true);

		const newForm = { ...form, ...data };

		if (newForm.post_id) {
			newForm.form_id = `${newForm.post_id}:${newForm.form_id}`;
		}

		try {
			const response = (await apiFetch({
				path: `/qc/v1/forms/${newForm.id}`,
				method: 'POST',
				data: newForm,
			})) as FormType;

			setForm(prepareForm(response));
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const prepareForm = (form: FormType) => {
		if (form.form_id?.includes(':')) {
			const [postId, formId] = form.form_id.split(':');
			form.post_id = parseInt(postId);
			form.form_id = formId;
		}

		return form;
	}

	// Switch to the new tab items
	const tabItems = [
		{
			key: 'information',
			label: __('Information', 'quillcrm'),
			children: <InitialStep />,
		},
		{
			key: 'settings',
			label: __('Settings', 'quillcrm'),
			children: <SettingsStep />,
			disabled: !form?.form_id || !form?.form_type,
		},
	];

	return (
		<Provider
			value={{
				form: form as FormType,
				isLoading: loading,
				isSaving,
				setIsLoading: setLoading,
				setIsSaving: setIsSaving,
				saveForm,
				...$actions,
			}}
		>
			{tab === 'overview' && <Overview />}
			{tab !== 'overview' && (
				<Tabs
					defaultActiveKey="information"
					activeKey={tab}
					tabPosition="left"
					tabBarStyle={{ width: 200 }}
					items={tabItems}
					onChange={(key) => {
						navigate(getToLink(`forms/${id}/${key}`));
					}}
				/>
			)}
		</Provider>
	);
};

export default Form;
