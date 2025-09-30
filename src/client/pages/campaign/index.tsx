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
import { useNavigate, useParams } from '@quillcrm/navigation';

/**
 * Internal dependencies
 */
import './style.scss';
import { Provider } from './state/context';
import reducer, { State } from './state/reducer';
import actions from './state/actions';
import TemplatesStep from './steps/templates';
import ContactsStep from './steps/contacts';
import ReviewStep from './steps/review';
import BuilderStep from '../../../builder';
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
		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/campaigns/${campaign.id}`,
				method: 'POST',
				data: {
					...campaign,
					...data,
				},
			})) as CampaignType;

			setCampaign(response);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to save campaign', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
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
			{(tab === 'template' || tab === null) && (
				<TemplatesStep />)}
			{tab === 'contacts' && (
				<ContactsStep />)}
			{tab === 'review' && (
				<ReviewStep />)}
			{tab === 'builder' && (
				<BuilderStep />)}
			{isOverview && <Overview />}
		</Provider>
	);
};

export default Campaign;
