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
import { Automation as AutomationType } from '@quillcrm/client';
import Workflow from './steps/workflow';
import Contacts from './steps/contacts';

const Automation: React.FC = () => {
	const { id, tab } = useParams<{ id: string; tab: string }>();
	const [state, dispatch] = useReducer(reducer, {
		automation: null,
		steps: [],
		updatedSteps: {},
	} as State);
	const stateRef = useRef<State>(state);
	stateRef.current = state;
	const $actions = actions(dispatch);
	const { setAutomation, setSteps } = $actions;
	const { automation, steps, updatedSteps } = state;
	const [loading, setLoading] = useState<boolean>(true);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const navigate = useNavigate();
	const { createNotice } = useDispatch('quillcrm/core');

	useEffect(() => {
		fetchAutomation();
	}, [id]);

	const fetchAutomation = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automations/${id}`,
			})) as AutomationType;

			setAutomation(response);
			setSteps(response.steps);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch automation', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const saveAutomation = async (data: Partial<AutomationType> = {}) => {
		setIsSaving(true);

		const newAutomation = { ...automation, ...data };

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automations/${newAutomation.id}`,
				method: 'POST',
				data: newAutomation,
			})) as AutomationType;

			setAutomation(response);
			setSteps(response.steps);
		} catch (error) {
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	// Switch to the new tab items
	const tabItems = [
		{
			key: 'workflow',
			label: __('Workflow', 'quillcrm'),
			children: <Workflow />,
		},
		{
			key: 'contacts',
			label: __('Contacts', 'quillcrm'),
			children: <Contacts />,
		},
	];

	return (
		<Provider
			value={{
				automation,
				steps,
				updatedSteps,
				isLoading: loading,
				isSaving,
				setIsLoading: setLoading,
				setIsSaving: setIsSaving,
				saveAutomation,
				...$actions,
			}}
		>
			<Tabs
				defaultActiveKey="inautomationation"
				activeKey={tab || 'workflow'}
				tabPosition="top"
				tabBarStyle={{ width: 200 }}
				items={tabItems}
				onChange={(key) => {
					navigate(getToLink(`automations/${id}/${key}`));
				}}
			/>
		</Provider>
	);
};

export default Automation;
