/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

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
import { Form as FormType } from '../types';
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

	useEffect(() => {
		fetchForm();
	}, [id]);

	const fetchForm = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/forms/${id}`,
			})) as any;

			setForm(response);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const saveForm = async (data: any = {}) => {
		setIsSaving(true);

		const newForm = { ...form, ...data };

		try {
			const response = (await apiFetch({
				path: `/qc/v1/forms/${newForm.id}`,
				method: 'POST',
				data: newForm,
			})) as FormType;

			setForm(response);
		} catch (error) {
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

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
		},
	];

	return (
		<Provider
			value={{
				form,
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
