/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import { useNavigate, useParams, getToLink } from '@doublescale/navigation';

/**
 * Internal dependencies
 */
import './style.scss';
import TemplatesStep from './steps/templates';
import EmailTemplatesStep from './steps/email-templates';
import SMSTemplateStep from './steps/templates/sms-template';
import WhatsAppTemplateStep from './steps/templates/whatsapp-template';
import ContactsStep from './steps/contacts';
import ReviewStep from './steps/review';
import TriggerStep from './steps/trigger';
import Builder from '../../../builder';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import Overview from './overview';
import StepsShimmer from './steps-shimmer';
import OverviewDialogShimmer from './overview-dialog-shimmer';
import ViewStep from './steps/view';

const STEP_ALIASES: Record<string, string> = {
	templates: 'template',
};

const normalizeTab = (t?: string) => (t ? STEP_ALIASES[t] ?? t : t);

const Campaign: React.FC = () => {
	const { id, tab: rawTab } = useParams<{ id: string; tab: string }>();
	const tab = normalizeTab(rawTab);
	const navigate = useNavigate();
	const isMountedRef = useRef(true);

	// Use WordPress data store instead of local state
	const campaign = useSelect(
		(select: any) => select('doublescale/campaign').getCampaign(),
		[]
	);
	const loading = useSelect(
		(select: any) => select('doublescale/campaign').isLoading(),
		[]
	);
	const currentStep = useSelect(
		(select: any) => select('doublescale/campaign').getCurrentStep(),
		[]
	);

	// Let builder handle its own default state; only pass DB data when available
	const [builderInitialData, setBuilderInitialData] = useState<
		any | undefined
	>(undefined);

	const { fetchCampaign, refreshCampaign, saveCampaignStep, resetCampaign } =
		useDispatch('doublescale/campaign');

	const { setCurrentTrigger } = useDispatch('doublescale/core');

	useEffect(() => {
		isMountedRef.current = true;

		// Clear previous campaign data when ID changes
		if (id) {
			resetCampaign();
			fetchCampaign(id);
		} else {
			// If no ID, clear the campaign state
			resetCampaign();
		}

		return () => {
			isMountedRef.current = false;
		};
	}, [id, fetchCampaign, resetCampaign]);

	useEffect(() => {
		if (
			campaign?.settings?.automated &&
			campaign?.settings?.trigger?.trigger_type === 'event' &&
			campaign?.settings?.trigger?.event?.event_type
		) {
			setCurrentTrigger(campaign.settings.trigger.event.event_type);
		}
	}, [campaign?.settings?.trigger, setCurrentTrigger]);

	// Redirect to saved current step when campaign is loaded
	useEffect(() => {
		if (campaign && !tab) {
			const isAutoCampaign = campaign?.settings?.automated === true;
			let targetStep: string;

			if (campaign.status === 'draft') {
				const defaultStep = isAutoCampaign ? 'trigger' : 'template';
				targetStep = currentStep || defaultStep;
			} else if (campaign.status === 'schedule') {
				targetStep = 'view';
			} else {
				targetStep = 'overview';
			}

			navigate(getToLink(`campaigns/${id}/${targetStep}`), {
				replace: true,
			});
		}
	}, [campaign, tab, id, navigate, currentStep]);

	// Legacy: draft automated campaigns may have current_step or URL on email-templates (standard flow only)
	useEffect(() => {
		if (
			!campaign ||
			!id ||
			!tab ||
			campaign.status !== 'draft' ||
			campaign.settings?.automated !== true ||
			tab !== 'email-templates'
		) {
			return;
		}
		navigate(getToLink(`campaigns/${id}/builder`), { replace: true });
	}, [campaign, tab, id, navigate]);

	// Save current step when tab changes (only for draft campaigns)
	useEffect(() => {
		if (campaign && tab && tab !== normalizeTab(currentStep) && campaign.status === 'draft') {
			saveCampaignStep(tab);
		}
	}, [tab, campaign, currentStep, saveCampaignStep]);

	// Clear builder initial data when leaving builder tab to avoid showing stale template on return
	useEffect(() => {
		if (tab !== 'builder') {
			setBuilderInitialData(undefined);
		}
	}, [tab]);

	// Refresh campaign then load builder data when navigating to builder
	// (fixes stale template when returning from recipients/review after changing template)
	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			if (tab !== 'builder' || !id) return;

			setBuilderInitialData(undefined);

			// Refresh campaign first to get latest template_id from server
			const refreshedCampaign = await refreshCampaign(id);
			if (!isMounted) return;

			const currentTemplateId = (refreshedCampaign as any)?.settings
				?.template_ids?.[0];

			if (!currentTemplateId) return;

			try {
				const { getTemplate } = await import('@/builder/api/templates');
				const tpl = await getTemplate(currentTemplateId);
				if (!isMounted) return;
				const body =
					typeof tpl.body === 'string'
						? JSON.parse(tpl.body)
						: tpl.body;
				if (body?.type === 'builder' && body.value) {
					setBuilderInitialData(body.value);
				}
			} catch (e) {
				if (isMounted) setBuilderInitialData(undefined);
			}
		};
		load();
		return () => {
			isMounted = false;
		};
	}, [tab, id, refreshCampaign]);

	// Get the correct template component based on campaign type
	const getTemplateComponent = () => {
		if (!campaign) return null;

		switch (campaign.type) {
			case CAMPAIGN_CHANNEL.SMS:
				return <SMSTemplateStep />;
			case CAMPAIGN_CHANNEL.WHATSAPP:
				return <WhatsAppTemplateStep />;
			case CAMPAIGN_CHANNEL.EMAIL:
			default:
				return <TemplatesStep />;
		}
	};

	const isOverview =
		campaign &&
		((campaign.status === 'schedule' && tab === 'overview') ||
			(campaign.status === 'draft' && tab === 'overview') ||
			(campaign.status === 'active' && tab === 'overview') ||
			['processing', 'completed', 'resending', 'failed', 'inactive'].includes(campaign.status));

	// Show loading state with appropriate shimmer
	if (loading) {
		// Check if we're loading overview or steps based on tab
		const isOverviewTab = tab === 'overview';
		return isOverviewTab ? <OverviewDialogShimmer /> : <StepsShimmer />;
	}

	// Show error state or redirect if no campaign
	if (!campaign) {
		return <div>Campaign not found</div>; // TODO: Replace with proper error component
	}

	const isAutomated = campaign?.settings?.automated === true;

	return (
		<>
			{/* Render the selected tab component based on the current tab */}
			{tab === 'trigger' && isAutomated && <TriggerStep />}
			{tab === 'template' && getTemplateComponent()}
			{tab === 'email-templates' && campaign?.type === CAMPAIGN_CHANNEL.EMAIL && (
				<EmailTemplatesStep />
			)}
			{tab === 'contacts' && <ContactsStep />}
			{tab === 'review' && <ReviewStep />}
			{tab === 'builder' && <Builder initialData={builderInitialData} />}
			{tab === 'view' && <ViewStep />}
			{isOverview && <Overview />}
		</>
	);
};

export default Campaign;
