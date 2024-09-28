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
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import { Provider } from './state/context';
import reducer, { State } from './state/reducer';
import actions from './state/actions';
import InitialStep from './steps/initial';
import TemplatesStep from './steps/templates';
import ContactsStep from './steps/contacts';
import ReviewStep from './steps/review';
import { Campaign as CampaignType } from '@quillcrm/client';
import Overview from './overview';

const Campaign: React.FC = () => {
	const { id, tab } = useParams<{ id: string; tab: string }>();
	const [state, dispatch] = useReducer(reducer, {
		campaign: null,
	} as State);
	const stateRef = useRef<State>(state);
	stateRef.current = state;
	const $actions = actions(dispatch);
	const { setCampaign } = $actions;
	const { campaign } = state;
	const [loading, setLoading] = useState<boolean>(true);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const navigate = useNavigate();
	const { createNotice } = useDispatch('quillcrm/core');

	useEffect(() => {
		fetchCampaign();
	}, [id]);

	const fetchCampaign = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/campaigns/${id}`,
			})) as CampaignType;

			setCampaign(response);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch campaign', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const saveCampaign = async () => {
		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/campaigns/${campaign.id}`,
				method: 'POST',
				data: campaign,
			})) as CampaignType;

			setCampaign(response);
			navigate(getToLink(`campaigns/${response.id}/overview`));
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to save campaign', 'quillcrm'),
			});
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
			icon:
				tab === 'information' || !tab ? (
					<CheckCircleOutlined />
				) : (
					<InfoCircleOutlined />
				),
		},
		{
			key: 'template',
			label: __('Template', 'quillcrm'),
			children: <TemplatesStep />,
			icon:
				tab === 'template' ? (
					<CheckCircleOutlined />
				) : (
					<InfoCircleOutlined />
				),
		},
		{
			key: 'contacts',
			label: __('Contacts', 'quillcrm'),
			children: <ContactsStep />,
			icon:
				tab === 'contacts' ? (
					<CheckCircleOutlined />
				) : (
					<InfoCircleOutlined />
				),
		},
		{
			key: 'review',
			label: __('Review', 'quillcrm'),
			children: <ReviewStep />,
			icon:
				tab === 'review' ? (
					<CheckCircleOutlined />
				) : (
					<InfoCircleOutlined />
				),
		},
	];

	return (
		<Provider
			value={{
				campaign,
				isLoading: loading,
				isSaving,
				setIsLoading: setLoading,
				setIsSaving: setIsSaving,
				saveCampaign,
				...$actions,
			}}
		>
			{tab !== 'overview' && campaign?.status !== 'completed' && (
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
			)}
			{tab === 'overview' && <Overview />}
		</Provider>
	);
};

export default Campaign;
