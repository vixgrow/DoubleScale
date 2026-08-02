/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Sparkles } from 'lucide-react';

/**
 * DoubleScale dependencies
 */
import ConfigAPI from '@doublescale/config';
import frameDashboardBg from '@doublescale/assets/images/Frame-dashboard.png';
import {
	PageHeader,
	RocketIcon,
	SalesIcon,
	ContactTotalEmailsIcon,
	TotalSMSIcon,
	AutomationsIcon,
	BookingIcon,
	HelpdeskIcon,
	TaskDoneIcon,
	ContactsIcon,
	MailboxIcon,
	AnalyticsReportsIcon,
	AiIcon,
	ManagerIcon,
	IntegrationsIcon,
	FormsIcon,
	CheckCircleIcon,
} from '@doublescale/components';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import './style.scss';

const DEMO_URL = 'https://try.doublescale.io';

/** Brand color every category icon renders in — some icons don't default to
 * `currentColor`, so it's passed explicitly to keep the grid visually consistent. */
const CATEGORY_ICON_COLOR = '#1e3a8a';

interface FeatureCategory {
	icon: React.ReactNode;
	title: string;
	features: string[];
}

const useFeatureCategories = (): FeatureCategory[] => [
	{
		icon: <ContactsIcon width={24} height={24} />,
		title: __('Contacts & CRM Insights', 'doublescale'),
		features: [
			__('Lead scoring', 'doublescale'),
			__('Custom fields for contacts & deals', 'doublescale'),
			__('Website visitor tracking', 'doublescale'),
			__('Advanced filter builder across contacts, deals & other lists', 'doublescale'),
			__('Custom field mapping on CSV import', 'doublescale'),
			__('Export contacts to CSV', 'doublescale'),
		],
	},
	{
		icon: <SalesIcon width={24} height={24} />,
		title: __('Sales & Invoicing', 'doublescale'),
		features: [
			__('Deal pipelines with drag-and-drop stages', 'doublescale'),
			__('Invoices, payments & subscriptions', 'doublescale'),
			__('Contracts with e-signature & file attachments', 'doublescale'),
			__('Credit notes and refunds', 'doublescale'),
			__('Internal approval workflow before sending', 'doublescale'),
			__('Client portal for invoices, contracts & credit notes', 'doublescale'),
			__('Abandoned cart recovery', 'doublescale'),
			__('Deal automation triggers & actions (stage, status, owner & value changes)', 'doublescale'),
		],
	},
	{
		icon: <ContactTotalEmailsIcon width={24} height={24} />,
		title: __('Email Builder & Templates', 'doublescale'),
		features: [
			__('Premium drag-and-drop email templates & blocks', 'doublescale'),
			__('Conditional content sections per recipient', 'doublescale'),
			__('Advanced button & theme styling', 'doublescale'),
			__('Saved blocks library for reuse across emails', 'doublescale'),
			__('Multi-step email sequences with delays & enrollment rules', 'doublescale'),
		],
	},
	{
		icon: <TotalSMSIcon width={24} height={24} />,
		title: __('SMS, WhatsApp & Unified Inbox', 'doublescale'),
		features: [
			__('Unified inbox — reply across Email, SMS & WhatsApp from one thread', 'doublescale'),
			__('SMS campaigns and broadcast messaging', 'doublescale'),
			__('WhatsApp Business templates & settings', 'doublescale'),
			__('SMS reminders for bookings', 'doublescale'),
		],
	},
	{
		icon: <AutomationsIcon width={24} height={24} />,
		title: __('Marketing Automation', 'doublescale'),
		features: [
			__('Conditional branching (if/else) in workflows', 'doublescale'),
			__('Premium triggers & actions across integrations', 'doublescale'),
			__('Trackable link triggers that fire automations on click', 'doublescale'),
			__(
				'WordPress triggers & actions for WooCommerce, LearnDash, Tutor LMS, LifterLMS, LearnPress, MemberPress, Paid Memberships Pro, Presto Player & SureCart',
				'doublescale'
			),
		],
	},
	{
		icon: <FormsIcon width={24} height={24} />,
		title: __('Forms', 'doublescale'),
		features: [
			__(
				'Premium form plugins: Gravity Forms, Formidable, Forminator, Ninja Forms, Elementor Forms, MetForm, SureForms, WS Form & more',
				'doublescale'
			),
			__('SaaS form builders: Typeform & Jotform', 'doublescale'),
		],
	},
	{
		icon: <BookingIcon width={24} height={24} color={CATEGORY_ICON_COLOR} />,
		title: __('Booking', 'doublescale'),
		features: [
			__('Team & round-robin booking events', 'doublescale'),
			__('Zoom, Google Meet & MS Teams conferencing', 'doublescale'),
			__('Paid bookings with Stripe', 'doublescale'),
			__('Custom questions, redirects & conditional logic', 'doublescale'),
			__('SMS reminders and waiting lists', 'doublescale'),
			__('Booking automation triggers & actions (created, confirmed, rescheduled, cancelled, completed)', 'doublescale'),
		],
	},
	{
		icon: <HelpdeskIcon width={24} height={24} />,
		title: __('Helpdesk', 'doublescale'),
		features: [
			__('Custom fields on tickets', 'doublescale'),
			__('Incoming webhooks from external tools', 'doublescale'),
			__('Auto-close rules for stale tickets', 'doublescale'),
			__('Ticket automation triggers & actions (replies, status, priority, agent assignment)', 'doublescale'),
		],
	},
	{
		icon: <TaskDoneIcon width={24} height={24} />,
		title: __('Projects & Tasks', 'doublescale'),
		features: [
			__('Project boards with custom statuses & progress tracking', 'doublescale'),
			__('Linked emails, files, notes, invoices & proposals per project', 'doublescale'),
			__('Client portal visibility for projects', 'doublescale'),
			__('Recurring tasks, subtasks & subtask groups', 'doublescale'),
			__('Task labels, comments, attachments & custom fields', 'doublescale'),
			__('Task automation triggers & actions', 'doublescale'),
		],
	},
	{
		icon: <MailboxIcon width={24} height={24} />,
		title: __('Shared Mailbox', 'doublescale'),
		features: [
			__('IMAP polling & Gmail/Outlook OAuth sync', 'doublescale'),
			__('Connect personal email to send & receive as yourself', 'doublescale'),
			__('Auto-create contacts from unknown senders', 'doublescale'),
		],
	},
	{
		icon: <AnalyticsReportsIcon width={24} height={24} />,
		title: __('Reports & Analytics', 'doublescale'),
		features: [
			__('Deal, sales-rep & pipeline analytics', 'doublescale'),
			__('Deal source analysis', 'doublescale'),
			__('Invoice, proposal, contract & credit note reports', 'doublescale'),
			__('Cart recovery & project analytics', 'doublescale'),
			__('Custom "My Reports"', 'doublescale'),
		],
	},
	{
		icon: <AiIcon width={24} height={24} />,
		title: __('AI & Notifications', 'doublescale'),
		features: [
			__('AI email builder', 'doublescale'),
			__('AI-powered contact & deal context summaries', 'doublescale'),
			__('In-app bell & browser desktop notifications, beyond email-only', 'doublescale'),
			__('Native mobile push notifications (iOS & Android)', 'doublescale'),
			__('Real-time alerts for deals, tasks, projects, campaigns & automations', 'doublescale'),
			__('Email open & click tracking notifications', 'doublescale'),
			__('Bounce handling via provider webhooks', 'doublescale'),
		],
	},
	{
		icon: <ManagerIcon width={24} height={24} />,
		title: __('Team & White Label', 'doublescale'),
		features: [
			__('Manager roles & team permissions', 'doublescale'),
			__('White-label branding for agencies', 'doublescale'),
		],
	},
	{
		icon: <IntegrationsIcon width={24} height={24} />,
		title: __('Third-Party Integrations', 'doublescale'),
		features: [
			__('Meta WhatsApp Business API', 'doublescale'),
			__('Stripe & PayPal for payments', 'doublescale'),
			__('Twilio SMS and Slack notifications', 'doublescale'),
			__('Typeform & Jotform', 'doublescale'),
			__('Zapier & Make', 'doublescale'),
		],
	},
];

const DiscoverPro: React.FC = () => {
	const pricingUrl = ConfigAPI.getUrlDoubleScalePro();
	const categories = useFeatureCategories();

	const openExternal = (url: string) => {
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	return (
		<div className="doublescale-discover-pro">
			<div
				className="doublescale-discover-pro-hero"
				style={{ backgroundImage: `url(${frameDashboardBg})` }}
			>
				<div className="doublescale-discover-pro-hero__header">
					<PageHeader
						title={__('Discover DoubleScale Pro', 'doublescale')}
						actions={[]}
					/>
				</div>
				<div className="doublescale-discover-pro-hero__promo">
					<div className="doublescale-discover-pro-hero__icon">
						<RocketIcon />
					</div>
					<p className="doublescale-discover-pro-hero__text">
						{__(
							'Everything below is already built into DoubleScale — deal pipelines, invoicing, the email builder, automations, shared mailbox, reporting, and more. Activate Pro to unlock it all in the platform you already run.',
							'doublescale'
						)}
					</p>
					<div className="doublescale-discover-pro-hero__actions">
						<Button
							variant="secondaryDeepBlue"
							className="hover:bg-white"
							onClick={() => openExternal(DEMO_URL)}
						>
							{__('Try Live Demo', 'doublescale')}
						</Button>
						<Button
							variant="gradient"
							onClick={() => openExternal(pricingUrl)}
						>
							{__('Get Started', 'doublescale')}
						</Button>
					</div>
				</div>
			</div>

			<div className="doublescale-discover-pro-grid">
				{categories.map((category) => (
					<Card key={category.title} className="shadow-none">
						<CardContent className="p-5">
							<div className="doublescale-discover-pro-grid__card-header">
								<span className="doublescale-discover-pro-grid__card-icon">
									{category.icon}
								</span>
								<h3 className="doublescale-discover-pro-grid__card-title">
									{category.title}
								</h3>
							</div>
							<ul className="doublescale-discover-pro-grid__card-list">
								{category.features.map((feature) => (
									<li key={feature}>
										<CheckCircleIcon width={16} height={16} />
										<span>{feature}</span>
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				))}

				<Card className="doublescale-discover-pro-grid__more-card shadow-none">
					<CardContent className="p-5">
						<span className="doublescale-discover-pro-grid__more-icon">
							<Sparkles width={20} height={20} />
						</span>
						<h3 className="doublescale-discover-pro-grid__more-title">
							{__('More coming soon', 'doublescale')}
						</h3>
						<p className="doublescale-discover-pro-grid__more-text">
							{__(
								"We're shipping new Pro features every month.",
								'doublescale'
							)}
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="doublescale-discover-pro-footer-cta">
				<h2>{__('Ready to unlock the full platform?', 'doublescale')}</h2>
				<div className="doublescale-discover-pro-footer-cta__actions">
					<Button variant="outline" onClick={() => openExternal(DEMO_URL)}>
						{__('Try Live Demo', 'doublescale')}
					</Button>
					<Button variant="gradient" onClick={() => openExternal(pricingUrl)}>
						{__('Get Started', 'doublescale')}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default DiscoverPro;
