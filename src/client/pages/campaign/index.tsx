/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import { useNavigate, useParams, getToLink } from '@quillcrm/navigation';

/**
 * Internal dependencies
 */
import './style.scss';
import TemplatesStep from './steps/templates';
import SMSTemplateStep from './steps/templates/sms-template';
// import WhatsAppTemplateStep from './steps/templates/whatsapp-template';
import ContactsStep from './steps/contacts';
import ReviewStep from './steps/review';
import Builder from '../../../builder';
import { CAMPAIGN_CHANNEL } from '@/constants/campaign-channel';
import Overview from './overview';
import StepsShimmer from './steps-shimmer';
import OverviewDialogShimmer from './overview-dialog-shimmer';
import ViewStep from './steps/view';

const Campaign: React.FC = () => {
	const { id, tab } = useParams<{ id: string; tab: string }>();
	const navigate = useNavigate();
	const isMountedRef = useRef(true);

	// Use WordPress data store instead of local state
	const campaign = useSelect(
		(select: any) => select('quillcrm/campaign').getCampaign(),
		[]
	);
	const loading = useSelect(
		(select: any) => select('quillcrm/campaign').isLoading(),
		[]
	);
	const currentStep = useSelect(
		(select: any) => select('quillcrm/campaign').getCurrentStep(),
		[]
	);
	const { template_id } = useSelect(
		(select: any) => select('quillcrm/campaign').getStepData('template'),
		[]
	);

	// Let builder handle its own default state; only pass DB data when available
	const [builderInitialData, setBuilderInitialData] = useState<
		any | undefined
	>(undefined);

	const { fetchCampaign, saveCampaignStep } =
		useDispatch('quillcrm/campaign');

	useEffect(() => {
		isMountedRef.current = true;

		if (id) {
			fetchCampaign(id);
		}

		return () => {
			isMountedRef.current = false;
		};
	}, [id, fetchCampaign]);

	// Redirect to saved current step when campaign is loaded
	useEffect(() => {
		if (campaign && !tab) {
			const targetStep = currentStep || 'template';
			navigate(getToLink(`campaigns/${id}/${targetStep}`), {
				replace: true,
			});
		}
	}, [campaign, tab, id, navigate, currentStep]);

	// Save current step when tab changes
	useEffect(() => {
		if (campaign && tab && tab !== currentStep) {
			saveCampaignStep(tab);
		}
	}, [tab, campaign, currentStep, saveCampaignStep]);

	// Load builder initial data from campaign's template_id
	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			// Only fetch when on the builder tab
			if (tab !== 'builder') {
				return;
			}
			// Clear current data first to avoid flashing stale content
			setBuilderInitialData(undefined);
			if (!template_id) {
				if (isMounted) setBuilderInitialData(undefined);
				return;
			}
			try {
				const { getTemplate } = await import('@/builder/api/templates');
				const tpl = await getTemplate(template_id);
				const body =
					typeof tpl.body === 'string'
						? JSON.parse(tpl.body)
						: tpl.body;
				if (body?.type === 'builder' && body.value) {
					if (isMounted) setBuilderInitialData(body.value);
				} else if (isMounted) {
					setBuilderInitialData(undefined);
				}
			} catch (e) {
				if (isMounted) setBuilderInitialData(undefined);
			}
		};
		load();
		return () => {
			isMounted = false;
		};
	}, [template_id, tab]);

	// Get the correct template component based on campaign type
	const getTemplateComponent = () => {
		if (!campaign) return null;

		switch (campaign.type) {
			case CAMPAIGN_CHANNEL.SMS:
				return <SMSTemplateStep />;
			// case CAMPAIGN_CHANNEL.WHATSAPP:
			// 	return <WhatsAppTemplateStep />;
			case CAMPAIGN_CHANNEL.EMAIL:
			default:
				return <TemplatesStep />;
		}
	};

	const isOverview =
		campaign &&
		((campaign.status === 'schedule' && tab === 'overview') ||
			(campaign.status === 'draft' && tab === 'overview') ||
			['processing', 'completed', 'resending'].includes(campaign.status));

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

	return (
		<>
			{/* Render the selected tab component based on the current tab */}
			{tab === 'template' && getTemplateComponent()}
			{tab === 'contacts' && <ContactsStep />}
			{tab === 'review' && <ReviewStep />}
			{tab === 'builder' && <Builder initialData={builderInitialData} />}
			{tab === 'view' && <ViewStep />}
			{isOverview && <Overview />}
		</>
	);
};

export default Campaign;
