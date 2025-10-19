/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
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
import WhatsAppTemplateStep from './steps/templates/whatsapp-template';
import ContactsStep from './steps/contacts';
import ReviewStep from './steps/review';
import BuilderStep from '../../../builder';
import Overview from './overview';

const Campaign: React.FC = () => {
	const { id, tab } = useParams<{ id: string; tab: string }>();
	const navigate = useNavigate();

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

	const { fetchCampaign, saveCampaignStep } =
		useDispatch('quillcrm/campaign');

	useEffect(() => {
		if (id) {
			fetchCampaign(id);
		}
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

	// Get the correct template component based on campaign type
	const getTemplateComponent = () => {
		if (!campaign) return null;

		switch (campaign.type) {
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
		campaign &&
		((campaign.status === 'schedule' && tab === 'overview') ||
			['processing', 'completed', 'resending'].includes(campaign.status));

	// Show loading state
	if (loading) {
		return <div>Loading...</div>; // TODO: Replace with proper loading component
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
			{tab === 'builder' && <BuilderStep />}
			{isOverview && <Overview />}
		</>
	);
};

export default Campaign;
