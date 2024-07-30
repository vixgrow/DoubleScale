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
import InitialStep from './steps/initial';
import TemplateStep from './steps/template';

const Campaign: React.FC = () => {
	const { id, tab } = useParams<{ id: string; tab: string }>();
	const [state, dispatch] = useReducer(reducer, {
		campaign: null,
		template: null,
	} as State);
	const stateRef = useRef<State>(state);
	stateRef.current = state;
	const $actions = actions(dispatch);
	const { setCampaign } = $actions;
	const { campaign, template } = state;
	const [loading, setLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		fetchCampaign();
	}, [id]);

	const fetchCampaign = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/campaigns/${id}`,
			})) as any;

			setCampaign(response);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const saveCampaign = async () => {
		setIsSaving(true);
		console.log('saveCampaign', campaign);

		try {
			await apiFetch({
				path: `/qc/v1/campaigns/${campaign.id}`,
				method: 'POST',
				data: campaign,
			});

			setCampaign(campaign);
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
			key: 'template',
			label: __('Template', 'quillcrm'),
			children: <TemplateStep />,
		},
	];

	return (
		<Provider
			value={{
				campaign,
				template,
				isLoading: loading,
				isSaving,
				setIsLoading: setLoading,
				setIsSaving: setIsSaving,
				saveCampaign,
				...$actions,
			}}
		>
			<Tabs
				defaultActiveKey="information"
				activeKey={tab}
				tabPosition="left"
				tabBarStyle={{ width: 200 }}
				items={tabItems}
				onChange={(key) => {
					navigate(getToLink(`campaigns/${id}/${key}`));
				}}
			/>
		</Provider>
	);
};

export default Campaign;
