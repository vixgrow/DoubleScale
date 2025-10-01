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

/**
 * Internal dependencies
 */
import './style.scss';
import { Provider } from './state/context';
import reducer, { State } from './state/reducer';
import actions from './state/actions';
import TemplatesStep from './steps/templates';
import SMSTemplateStep from './steps/templates/sms-template';
import WhatsAppTemplateStep from './steps/templates/whatsapp-template';
import ContactsStep from './steps/contacts';
import ReviewStep from './steps/review';
import BuilderStep from '../../../builder';
import { Campaign as CampaignType } from '@quillcrm/client';
import Overview from './overview';
import { getCampaignEndpoint } from '@quillcrm/utils';

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

	// Redirect to saved current step when campaign is loaded
	useEffect(() => {
		if (campaign && !tab) {
			const targetStep = campaign.settings?.current_step || 'template';
			navigate(getToLink(`campaigns/${id}/${targetStep}`), {
				replace: true,
			});
		}
	}, [campaign, tab, id, navigate]);

	// Save current step when tab changes
	useEffect(() => {
		if (campaign && tab && tab !== campaign.settings?.current_step) {
			saveCampaignStep(tab);
		}
	}, [tab, campaign]);

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

	const saveCampaignStep = async (step: string, stepData?: any) => {
		if (!campaign) return false;

		try {
			const updatedSettings = {
				...campaign.settings,
				current_step: step,
				...stepData, // Merge any additional step-specific data
			};

			const response = (await apiFetch({
				path: `/qc/v1/campaigns/${campaign.id}`,
				method: 'POST',
				data: {
					...campaign,
					settings: updatedSettings,
				},
			})) as CampaignType;

			// Update local state with the response
			setCampaign(response);
			return true;
		} catch (error) {
			console.error('Failed to save current step:', error);
			createNotice({
				type: 'error',
				message: __(
					'Failed to save step data. Please try again.',
					'quillcrm'
				),
			});
			return false;
		}
	};

	if (!campaign) {
		//TODO: change for shimmer
		return false;
	}

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
				saveCampaignStep,
				...$actions,
			}}
		>
			{/* Render the selected tab component based on the current tab */}
			{tab === 'template' && getTemplateComponent()}
			{tab === 'contacts' && <ContactsStep />}
			{tab === 'review' && <ReviewStep />}
			{tab === 'builder' && <BuilderStep />}
			{isOverview && <Overview />}
		</Provider>
	);
};

export default Campaign;
