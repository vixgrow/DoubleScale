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
import { Tabs, Skeleton } from 'antd';
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
import SMSTemplateStep from './steps/templates/sms-template';
import WhatsAppTemplateStep from './steps/templates/whatsapp-template';
import ContactsStep from './steps/contacts';
import ReviewStep from './steps/review';
import { Campaign as CampaignType } from '@quillcrm/client';
import Overview from './overview';

const Campaign: React.FC = () => {
	const { id, tab } = useParams<{ id: string; tab: string }>();
	const [state, dispatch] = useReducer(reducer, {
		campaign: null as CampaignType | null,
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

	const saveCampaign = async (data: Partial<CampaignType> = {}) => {
		if (!campaign) {
			throw new Error(__('Campaign not loaded', 'quillcrm'));
		}

		setIsSaving(true);

		try {
			// Get the correct endpoint based on campaign type
			const getCampaignEndpoint = (campaignType: string) => {
				const endpoints = {
					email: '/qc/v1/email-campaigns',
					sms: '/qc/v1/sms-campaigns',
					whatsapp: '/qc/v1/whatsapp-campaigns',
				} as const;
				return endpoints[campaignType as keyof typeof endpoints];
			};

			const endpoint = getCampaignEndpoint(campaign.type);
			if (!endpoint) {
				throw new Error(__('Invalid campaign type', 'quillcrm'));
			}

			const response = (await apiFetch({
				path: `${endpoint}/${campaign.id}`,
				method: 'PUT',
				data: {
					...campaign,
					...data,
				},
			})) as CampaignType;

			setCampaign(response);

			return response;
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const canGoNext = (nextTab: string) => {
		if (!campaign) {
			return false;
		}

		let canGo = true;

		switch (nextTab) {
			case 'template':
				canGo = campaign?.name;
				break;
			case 'contacts':
			case 'review':
				canGo =
					campaign.settings?.templates?.length > 0 && campaign?.name;
				break;
		}

		return canGo;
	};

	// Get the correct template component based on campaign type
	const getTemplateComponent = () => {
		switch (campaign?.type) {
			case 'sms':
				return <SMSTemplateStep />;
			case 'whatsapp':
				return <WhatsAppTemplateStep />;
			case 'email':
			default:
				return <TemplatesStep />;
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
			children: getTemplateComponent(),
			icon:
				tab === 'template' ? (
					<CheckCircleOutlined />
				) : (
					<InfoCircleOutlined />
				),
			disabled: !canGoNext('template'),
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
			disabled: !canGoNext('contacts'),
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
			disabled: !canGoNext('review'),
		},
	];

	if (!campaign) {
		return <Skeleton active />;
	}

	const isOverview =
		(campaign.status === 'schedule' && tab === 'overview') ||
		(['processing', 'completed', 'resending'].includes(campaign.status)
			? true
			: false);

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
			{/* Render the selected tab component based on the current tab */}
			{tab === 'template' ? (
				getTemplateComponent()
			) : (
				<>
					{!['processing', 'completed', 'resending'].includes(
						campaign.status
					) &&
						tab !== 'overview' && (
							<Tabs
								defaultActiveKey="information"
								activeKey={
									tab === 'overview' ? 'information' : tab
								}
								tabPosition="left"
								tabBarStyle={{ width: 200 }}
								items={tabItems}
								onChange={(key) => {
									if (canGoNext(key)) {
										navigate(
											getToLink(`campaigns/${id}/${key}`)
										);
									}
								}}
							/>
						)}
				</>
			)}
			{isOverview && <Overview />}
		</Provider>
	);
};

export default Campaign;
