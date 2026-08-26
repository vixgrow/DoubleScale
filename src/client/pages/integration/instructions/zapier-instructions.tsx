/**
 * Zapier integration setup instructions and example templates.
 *
 * Nothing is connected on this screen: DoubleScale is a published Zapier app,
 * so accounts are linked inside Zapier itself. This panel explains how a Zap is
 * put together and offers ready-made ones that open in Zapier with both steps
 * already chosen.
 */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, Fragment } from '@wordpress/element';

/**
 * External dependencies
 */
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Internal dependencies
 */
import ConfigAPI from '@doublescale/config';
import { ExternalLinkIcon, LogoIcon } from '@doublescale/components';

const ZAPIER_HOME_URL = 'https://zapier.com/app/zaps';

const linkClass =
	'text-primary font-semibold hover:underline inline-flex items-center gap-1';

const ExternalHref: React.FC<{ href: string; children: React.ReactNode }> = ( {
	href,
	children,
} ) => (
	<a
		href={ href }
		target="_blank"
		rel="noopener noreferrer"
		className={ linkClass }
	>
		{ children }
		<ExternalLinkIcon
			width={ 24 }
			height={ 24 }
			className="w-6 h-6 shrink-0"
			aria-hidden
		/>
	</a>
);

/**
 * Example Zap recipes.
 *
 * `zapTrigger` / `zapAction` are keys from the published DoubleScale Zapier
 * app (App243653); `partnerApp` is Zapier's key for the other app. Together
 * they build the deep link that opens Zapier with both steps already chosen.
 */
interface Template {
	title: string;
	outbound: boolean;
	summary: string;
	partnerApp: string;
	partnerLabel: string;
	/**
	 * The partner app's own event key, so its step opens with the event chosen
	 * instead of "Select event". Scraped from Zapier's app pages — these are not
	 * guessable (Gmail's is `message` for both sending and receiving, told apart
	 * by the step's read/write type).
	 */
	partnerAction: string;
	category: string;
	/** DoubleScale trigger key, for recipes that start here. */
	zapTrigger?: string;
	/** DoubleScale action key, for recipes that end here. */
	zapAction?: string;
	here: string[];
	there: string[];
}

/**
 * App key of the published DoubleScale integration, pinned to a version.
 *
 * The version suffix is not optional. A link that leaves it off lets Zapier
 * resolve whatever version it likes, which is how a Zap ends up pointing at a
 * version that has since been deleted and renders as "This version is no longer
 * available". Bump this when a new version is promoted.
 */
const DOUBLESCALE_APP = 'App243653CLIAPI@1.0.0';

/**
 * Build the "open a new Zap with these steps" link.
 *
 * Mirrors the links Zapier puts on its own app-pairing pages, which is the only
 * form observed to work:
 *
 *   /webintent/create-zap?steps[1][app]=GoogleSheetsV2CLIAPI@latest
 *                        &steps[1][type]=read
 *                        &steps[2][app]=SlackCLIAPI@latest
 *                        &steps[2][type]=write
 *
 * Three details are load-bearing. Every app is `<Name>CLIAPI@<version>` — a
 * plain name or directory slug renders as "Deleted app". Steps are numbered
 * from 1, not 0. And `type` marks which step is the trigger (`read`) and which
 * is the action (`write`).
 *
 * Partner apps use `@latest` so a partner's version bump cannot strand these
 * links; ours is pinned, because an unpinned DoubleScale resolved to a deleted
 * version and rendered "This version is no longer available".
 *
 * Both steps also carry an `action`, so neither opens on "Select event".
 * Zapier's own pairing links omit it — that is why their generic links land on
 * an unchosen event — but the parameter is honoured when supplied.
 */
const buildZapUrl = ( template: Template ): string => {
	const ours = {
		app: DOUBLESCALE_APP,
		action: template.outbound ? template.zapTrigger : template.zapAction,
	};
	const theirs = {
		app: `${ template.partnerApp }@latest`,
		action: template.partnerAction,
	};

	const [ trigger, action ] = template.outbound
		? [ ours, theirs ]
		: [ theirs, ours ];

	const params = new URLSearchParams();

	params.set( 'steps[1][app]', trigger.app );
	params.set( 'steps[1][type]', 'read' );
	if ( trigger.action ) {
		params.set( 'steps[1][action]', trigger.action );
	}

	params.set( 'steps[2][app]', action.app );
	params.set( 'steps[2][type]', 'write' );
	if ( action.action ) {
		params.set( 'steps[2][action]', action.action );
	}

	return `https://zapier.com/webintent/create-zap?${ params.toString() }`;
};

/**
 * Logo file for each partner app, relative to assets/images/.
 *
 * Bundled rather than loaded from Zapier's CDN: the admin should not phone a
 * third party on every page view, and the panel has to render on a site with no
 * outbound network access.
 */
const PARTNER_LOGOS: Record< string, string > = {
	SlackCLIAPI: 'slack/slack.png',
	GoogleSheetsV2CLIAPI: 'google-sheets/google-sheets.png',
	GoogleMailV2CLIAPI: 'gmail/gmail.png',
	AsanaCLIAPI: 'asana/asana.png',
	TwilioCLIAPI: 'twilio/twilio.png',
	TypeformCLIAPI: 'typeform/typeform.svg',
};

/** Order the template groups appear in. */
const CATEGORY_ORDER = [
	'sales',
	'contacts',
	'tasks',
	'support',
	'bookings',
	'approvals',
	'incoming',
] as const;

/** Resolved at render, not module load, so translations are in place. */
const getCategoryLabels = (): Record< string, string > => ( {
	sales: __( 'Sales', 'doublescale' ),
	contacts: __( 'Contacts', 'doublescale' ),
	tasks: __( 'Tasks', 'doublescale' ),
	support: __( 'Support', 'doublescale' ),
	bookings: __( 'Bookings', 'doublescale' ),
	approvals: __( 'Approvals', 'doublescale' ),
	incoming: __( 'Into DoubleScale', 'doublescale' ),
} );

const getTemplates = (): Template[] => [
	{
		title: __( 'Deal won \u2192 Slack notification', 'doublescale' ),
		category: 'sales',
		outbound: true,
		partnerApp: 'SlackCLIAPI',
		partnerLabel: 'Slack',
		partnerAction: 'channel_message',
		zapTrigger: 'deal_stage_changed',
		summary: __( 'Tell the team the moment a deal closes.', 'doublescale' ),
		here: [ __( 'Trigger: Deal Stage Changed', 'doublescale' ) ],
		there: [ __( 'Action: Slack \u2192 Send Channel Message', 'doublescale' ) ],
	},
	{
		title: __( 'New deal \u2192 Google Sheets row', 'doublescale' ),
		category: 'sales',
		outbound: true,
		partnerApp: 'GoogleSheetsV2CLIAPI',
		partnerLabel: 'Google Sheets',
		partnerAction: 'add_row',
		zapTrigger: 'deal_created',
		summary: __( 'A pipeline log that keeps itself up to date.', 'doublescale' ),
		here: [ __( 'Trigger: Deal Created', 'doublescale' ) ],
		there: [ __( 'Action: Google Sheets \u2192 Create Spreadsheet Row', 'doublescale' ) ],
	},
	{
		title: __( 'Deal value changed \u2192 Slack', 'doublescale' ),
		category: 'sales',
		outbound: true,
		partnerApp: 'SlackCLIAPI',
		partnerLabel: 'Slack',
		partnerAction: 'channel_message',
		zapTrigger: 'deal_value_changed',
		summary: __( 'Catch big swings in a deal before the review meeting.', 'doublescale' ),
		here: [ __( 'Trigger: Deal Value Changed', 'doublescale' ) ],
		there: [ __( 'Action: Slack \u2192 Send Channel Message', 'doublescale' ) ],
	},
	{
		title: __( 'Deal reassigned \u2192 email the new owner', 'doublescale' ),
		category: 'sales',
		outbound: true,
		partnerApp: 'GoogleMailV2CLIAPI',
		partnerLabel: 'Gmail',
		partnerAction: 'message',
		zapTrigger: 'deal_owner_changed',
		summary: __( 'The new owner hears it from the system, not a hallway chat.', 'doublescale' ),
		here: [ __( 'Trigger: Deal Owner Changed', 'doublescale' ) ],
		there: [ __( 'Action: Gmail \u2192 Send Email', 'doublescale' ) ],
	},
	{
		title: __( 'Contract signed \u2192 SMS alert', 'doublescale' ),
		category: 'sales',
		outbound: true,
		partnerApp: 'TwilioCLIAPI',
		partnerLabel: 'Twilio',
		partnerAction: 'smsv2',
		zapTrigger: 'contract_signed',
		summary: __( 'Know the second a contract comes back signed.', 'doublescale' ),
		here: [ __( 'Trigger: Contract Signed', 'doublescale' ) ],
		there: [ __( 'Action: Twilio \u2192 Send SMS', 'doublescale' ) ],
	},
	{
		title: __( 'Contract sent \u2192 follow-up task', 'doublescale' ),
		category: 'sales',
		outbound: true,
		partnerApp: 'AsanaCLIAPI',
		partnerLabel: 'Asana',
		partnerAction: 'create_task_v2',
		zapTrigger: 'contract_sent',
		summary: __( 'Every sent contract gets a chase-up owner.', 'doublescale' ),
		here: [ __( 'Trigger: Contract Sent', 'doublescale' ) ],
		there: [ __( 'Action: Asana \u2192 Create Task', 'doublescale' ) ],
	},
	{
		title: __( 'Credit note sent \u2192 log it', 'doublescale' ),
		category: 'sales',
		outbound: true,
		partnerApp: 'GoogleSheetsV2CLIAPI',
		partnerLabel: 'Google Sheets',
		partnerAction: 'add_row',
		zapTrigger: 'credit_note_sent',
		summary: __( 'Keep finance in the loop on every credit note.', 'doublescale' ),
		here: [ __( 'Trigger: Credit Note Sent', 'doublescale' ) ],
		there: [ __( 'Action: Google Sheets \u2192 Create Spreadsheet Row', 'doublescale' ) ],
	},
	{
		title: __( 'New contact \u2192 welcome email', 'doublescale' ),
		category: 'contacts',
		outbound: true,
		partnerApp: 'GoogleMailV2CLIAPI',
		partnerLabel: 'Gmail',
		partnerAction: 'message',
		zapTrigger: 'contact_subscribed',
		summary: __( 'Greet every new subscriber automatically.', 'doublescale' ),
		here: [ __( 'Trigger: Contact Subscribed', 'doublescale' ) ],
		there: [ __( 'Action: Gmail \u2192 Send Email', 'doublescale' ) ],
	},
	{
		title: __( 'Contact unsubscribed \u2192 log it', 'doublescale' ),
		category: 'contacts',
		outbound: true,
		partnerApp: 'GoogleSheetsV2CLIAPI',
		partnerLabel: 'Google Sheets',
		partnerAction: 'add_row',
		zapTrigger: 'contact_unsubscribed',
		summary: __( 'Track churn without opening the CRM.', 'doublescale' ),
		here: [ __( 'Trigger: Contact Unsubscribed', 'doublescale' ) ],
		there: [ __( 'Action: Google Sheets \u2192 Create Spreadsheet Row', 'doublescale' ) ],
	},
	{
		title: __( 'Contact tagged \u2192 alert the team', 'doublescale' ),
		category: 'contacts',
		outbound: true,
		partnerApp: 'SlackCLIAPI',
		partnerLabel: 'Slack',
		partnerAction: 'channel_message',
		zapTrigger: 'contact_tags_applied',
		summary: __( 'Get pinged when a contact hits a tag you care about.', 'doublescale' ),
		here: [ __( 'Trigger: Contact Tags Applied', 'doublescale' ) ],
		there: [ __( 'Action: Slack \u2192 Send Channel Message', 'doublescale' ) ],
	},
	{
		title: __( 'Added to a list \u2192 send a sequence', 'doublescale' ),
		category: 'contacts',
		outbound: true,
		partnerApp: 'GoogleMailV2CLIAPI',
		partnerLabel: 'Gmail',
		partnerAction: 'message',
		zapTrigger: 'contact_lists_applied',
		summary: __( 'Kick off outreach the moment someone joins a list.', 'doublescale' ),
		here: [ __( 'Trigger: Contact Added to List', 'doublescale' ) ],
		there: [ __( 'Action: Gmail \u2192 Send Email', 'doublescale' ) ],
	},
	{
		title: __( 'Typeform entry \u2192 new contact', 'doublescale' ),
		category: 'contacts',
		outbound: false,
		partnerApp: 'TypeformCLIAPI',
		partnerLabel: 'Typeform',
		partnerAction: 'entries_resthook_v2',
		zapAction: 'create_contact',
		summary: __( 'Leads land in the CRM without copy-paste.', 'doublescale' ),
		here: [ __( 'Action: Create or Update Contact', 'doublescale' ) ],
		there: [ __( 'Trigger: Typeform \u2192 New Entry', 'doublescale' ) ],
	},
	{
		title: __( 'Typeform entry \u2192 tag the contact', 'doublescale' ),
		category: 'contacts',
		outbound: false,
		partnerApp: 'TypeformCLIAPI',
		partnerLabel: 'Typeform',
		partnerAction: 'entries_resthook_v2',
		zapAction: 'add_tags',
		summary: __( 'Tag by which form they filled in, automatically.', 'doublescale' ),
		here: [ __( 'Action: Add Tags to Contact', 'doublescale' ) ],
		there: [ __( 'Trigger: Typeform \u2192 New Entry', 'doublescale' ) ],
	},
	{
		title: __( 'Typeform entry \u2192 open a deal', 'doublescale' ),
		category: 'contacts',
		outbound: false,
		partnerApp: 'TypeformCLIAPI',
		partnerLabel: 'Typeform',
		partnerAction: 'entries_resthook_v2',
		zapAction: 'add_deal',
		summary: __( 'Turn a qualified enquiry straight into pipeline.', 'doublescale' ),
		here: [ __( 'Action: Create Deal', 'doublescale' ) ],
		there: [ __( 'Trigger: Typeform \u2192 New Entry', 'doublescale' ) ],
	},
	{
		title: __( 'Google Sheets row \u2192 contact', 'doublescale' ),
		category: 'incoming',
		outbound: false,
		partnerApp: 'GoogleSheetsV2CLIAPI',
		partnerLabel: 'Google Sheets',
		partnerAction: 'new_row',
		zapAction: 'create_contact',
		summary: __( 'Import a list without touching a CSV.', 'doublescale' ),
		here: [ __( 'Action: Create or Update Contact', 'doublescale' ) ],
		there: [ __( 'Trigger: Google Sheets \u2192 New Spreadsheet Row', 'doublescale' ) ],
	},
	{
		title: __( 'New Gmail enquiry \u2192 contact', 'doublescale' ),
		category: 'incoming',
		outbound: false,
		partnerApp: 'GoogleMailV2CLIAPI',
		partnerLabel: 'Gmail',
		partnerAction: 'message',
		zapAction: 'create_contact',
		summary: __( 'Anyone who emails you ends up in the CRM.', 'doublescale' ),
		here: [ __( 'Action: Create or Update Contact', 'doublescale' ) ],
		there: [ __( 'Trigger: Gmail \u2192 New Email', 'doublescale' ) ],
	},
	{
		title: __( 'Slack message \u2192 contact or deal', 'doublescale' ),
		category: 'incoming',
		outbound: false,
		partnerApp: 'SlackCLIAPI',
		partnerLabel: 'Slack',
		partnerAction: 'pushed_message',
		zapAction: 'create_item',
		summary: __( 'Log a lead the moment it lands in a channel.', 'doublescale' ),
		here: [ __( 'Action: Create Item', 'doublescale' ) ],
		there: [ __( 'Trigger: Slack \u2192 New Pushed Message', 'doublescale' ) ],
	},
	{
		title: __( 'Typeform answer \u2192 add to a list', 'doublescale' ),
		category: 'incoming',
		outbound: false,
		partnerApp: 'TypeformCLIAPI',
		partnerLabel: 'Typeform',
		partnerAction: 'entries_resthook_v2',
		zapAction: 'add_to_lists',
		summary: __( 'Route each respondent to the right list.', 'doublescale' ),
		here: [ __( 'Action: Add Contact to Lists', 'doublescale' ) ],
		there: [ __( 'Trigger: Typeform \u2192 New Entry', 'doublescale' ) ],
	},
	{
		title: __( 'Sheets row \u2192 tag the contact', 'doublescale' ),
		category: 'incoming',
		outbound: false,
		partnerApp: 'GoogleSheetsV2CLIAPI',
		partnerLabel: 'Google Sheets',
		partnerAction: 'new_row',
		zapAction: 'add_tags',
		summary: __( 'Bulk-tag from a spreadsheet you already keep.', 'doublescale' ),
		here: [ __( 'Action: Add Tags to Contact', 'doublescale' ) ],
		there: [ __( 'Trigger: Google Sheets \u2192 New Spreadsheet Row', 'doublescale' ) ],
	},
	{
		title: __( 'Unsubscribe form \u2192 remove tags', 'doublescale' ),
		category: 'incoming',
		outbound: false,
		partnerApp: 'TypeformCLIAPI',
		partnerLabel: 'Typeform',
		partnerAction: 'entries_resthook_v2',
		zapAction: 'remove_tags',
		summary: __( 'Preference changes apply themselves.', 'doublescale' ),
		here: [ __( 'Action: Remove Tags From Contact', 'doublescale' ) ],
		there: [ __( 'Trigger: Typeform \u2192 New Entry', 'doublescale' ) ],
	},
	{
		title: __( 'Opt-out form \u2192 remove from lists', 'doublescale' ),
		category: 'incoming',
		outbound: false,
		partnerApp: 'TypeformCLIAPI',
		partnerLabel: 'Typeform',
		partnerAction: 'entries_resthook_v2',
		zapAction: 'remove_from_lists',
		summary: __( 'Honour opt-outs without manual cleanup.', 'doublescale' ),
		here: [ __( 'Action: Remove Contact From Lists', 'doublescale' ) ],
		there: [ __( 'Trigger: Typeform \u2192 New Entry', 'doublescale' ) ],
	},
	{
		title: __( 'Sheets row \u2192 change subscription status', 'doublescale' ),
		category: 'incoming',
		outbound: false,
		partnerApp: 'GoogleSheetsV2CLIAPI',
		partnerLabel: 'Google Sheets',
		partnerAction: 'new_row',
		zapAction: 'change_status',
		summary: __( 'Sync email, SMS, and WhatsApp consent in bulk.', 'doublescale' ),
		here: [ __( 'Action: Change Contact Status', 'doublescale' ) ],
		there: [ __( 'Trigger: Google Sheets \u2192 New Spreadsheet Row', 'doublescale' ) ],
	},
	{
		title: __( 'Asana task done \u2192 update the deal', 'doublescale' ),
		category: 'incoming',
		outbound: false,
		partnerApp: 'AsanaCLIAPI',
		partnerLabel: 'Asana',
		partnerAction: 'completed_task_in_project',
		zapAction: 'update_item',
		summary: __( 'Delivery progress writes itself back to the deal.', 'doublescale' ),
		here: [ __( 'Action: Update Item', 'doublescale' ) ],
		there: [ __( 'Trigger: Asana \u2192 Completed Task', 'doublescale' ) ],
	},
	{
		title: __( 'Sheets row \u2192 move deal stage', 'doublescale' ),
		category: 'incoming',
		outbound: false,
		partnerApp: 'GoogleSheetsV2CLIAPI',
		partnerLabel: 'Google Sheets',
		partnerAction: 'updated_row',
		zapAction: 'update_deal_stage',
		summary: __( 'Drive the pipeline from a sheet the team already edits.', 'doublescale' ),
		here: [ __( 'Action: Update Deal Stage', 'doublescale' ) ],
		there: [ __( 'Trigger: Google Sheets \u2192 New or Updated Spreadsheet Row', 'doublescale' ) ],
	},
	{
		title: __( 'New task \u2192 Asana task', 'doublescale' ),
		category: 'tasks',
		outbound: true,
		partnerApp: 'AsanaCLIAPI',
		partnerLabel: 'Asana',
		partnerAction: 'create_task_v2',
		zapTrigger: 'task_created',
		summary: __( 'Mirror DoubleScale work into your project tool.', 'doublescale' ),
		here: [ __( 'Trigger: Task Created', 'doublescale' ) ],
		there: [ __( 'Action: Asana \u2192 Create Task', 'doublescale' ) ],
	},
	{
		title: __( 'Task completed \u2192 Slack', 'doublescale' ),
		category: 'tasks',
		outbound: true,
		partnerApp: 'SlackCLIAPI',
		partnerLabel: 'Slack',
		partnerAction: 'channel_message',
		zapTrigger: 'task_completed',
		summary: __( 'Give the team a live feed of finished work.', 'doublescale' ),
		here: [ __( 'Trigger: Task Completed', 'doublescale' ) ],
		there: [ __( 'Action: Slack \u2192 Send Channel Message', 'doublescale' ) ],
	},
	{
		title: __( 'Task reassigned \u2192 tell the assignee', 'doublescale' ),
		category: 'tasks',
		outbound: true,
		partnerApp: 'GoogleMailV2CLIAPI',
		partnerLabel: 'Gmail',
		partnerAction: 'message',
		zapTrigger: 'task_reassigned',
		summary: __( 'Nobody misses work handed to them.', 'doublescale' ),
		here: [ __( 'Trigger: Task Reassigned', 'doublescale' ) ],
		there: [ __( 'Action: Gmail \u2192 Send Email', 'doublescale' ) ],
	},
	{
		title: __( 'New ticket \u2192 Asana task', 'doublescale' ),
		category: 'support',
		outbound: true,
		partnerApp: 'AsanaCLIAPI',
		partnerLabel: 'Asana',
		partnerAction: 'create_task_v2',
		zapTrigger: 'ticket_created',
		summary: __( 'Support requests become tracked work.', 'doublescale' ),
		here: [ __( 'Trigger: Support Ticket Created', 'doublescale' ) ],
		there: [ __( 'Action: Asana \u2192 Create Task', 'doublescale' ) ],
	},
	{
		title: __( 'New ticket \u2192 Slack alert', 'doublescale' ),
		category: 'support',
		outbound: true,
		partnerApp: 'SlackCLIAPI',
		partnerLabel: 'Slack',
		partnerAction: 'channel_message',
		zapTrigger: 'ticket_created',
		summary: __( 'The team sees new tickets where they already work.', 'doublescale' ),
		here: [ __( 'Trigger: Support Ticket Created', 'doublescale' ) ],
		there: [ __( 'Action: Slack \u2192 Send Channel Message', 'doublescale' ) ],
	},
	{
		title: __( 'Ticket reply \u2192 notify the owner', 'doublescale' ),
		category: 'support',
		outbound: true,
		partnerApp: 'GoogleMailV2CLIAPI',
		partnerLabel: 'Gmail',
		partnerAction: 'message',
		zapTrigger: 'ticket_reply',
		summary: __( 'Replies do not sit unread over a weekend.', 'doublescale' ),
		here: [ __( 'Trigger: Support Ticket Reply', 'doublescale' ) ],
		there: [ __( 'Action: Gmail \u2192 Send Email', 'doublescale' ) ],
	},
	{
		title: __( 'Booking confirmed \u2192 SMS reminder', 'doublescale' ),
		category: 'bookings',
		outbound: true,
		partnerApp: 'TwilioCLIAPI',
		partnerLabel: 'Twilio',
		partnerAction: 'smsv2',
		zapTrigger: 'booking_confirmed',
		summary: __( 'Cut no-shows with a text the moment it is booked.', 'doublescale' ),
		here: [ __( 'Trigger: Booking Confirmed', 'doublescale' ) ],
		there: [ __( 'Action: Twilio \u2192 Send SMS', 'doublescale' ) ],
	},
	{
		title: __( 'Booking cancelled \u2192 Slack', 'doublescale' ),
		category: 'bookings',
		outbound: true,
		partnerApp: 'SlackCLIAPI',
		partnerLabel: 'Slack',
		partnerAction: 'channel_message',
		zapTrigger: 'booking_cancelled',
		summary: __( 'Free the slot before anyone travels for it.', 'doublescale' ),
		here: [ __( 'Trigger: Booking Cancelled', 'doublescale' ) ],
		there: [ __( 'Action: Slack \u2192 Send Channel Message', 'doublescale' ) ],
	},
	{
		title: __( 'No-show \u2192 log and follow up', 'doublescale' ),
		category: 'bookings',
		outbound: true,
		partnerApp: 'GoogleSheetsV2CLIAPI',
		partnerLabel: 'Google Sheets',
		partnerAction: 'add_row',
		zapTrigger: 'booking_no_show',
		summary: __( 'Spot repeat no-shows in one sheet.', 'doublescale' ),
		here: [ __( 'Trigger: Booking No Show', 'doublescale' ) ],
		there: [ __( 'Action: Google Sheets \u2192 Create Spreadsheet Row', 'doublescale' ) ],
	},
	{
		title: __( 'Approval requested \u2192 Slack', 'doublescale' ),
		category: 'approvals',
		outbound: true,
		partnerApp: 'SlackCLIAPI',
		partnerLabel: 'Slack',
		partnerAction: 'channel_message',
		zapTrigger: 'approval_requested',
		summary: __( 'Approvers get pinged instead of chased.', 'doublescale' ),
		here: [ __( 'Trigger: Approval Requested', 'doublescale' ) ],
		there: [ __( 'Action: Slack \u2192 Send Channel Message', 'doublescale' ) ],
	},
	{
		title: __( 'Approval rejected \u2192 email the requester', 'doublescale' ),
		category: 'approvals',
		outbound: true,
		partnerApp: 'GoogleMailV2CLIAPI',
		partnerLabel: 'Gmail',
		partnerAction: 'message',
		zapTrigger: 'approval_rejected',
		summary: __( 'A rejection always comes with a reason and a name.', 'doublescale' ),
		here: [ __( 'Trigger: Approval Rejected', 'doublescale' ) ],
		there: [ __( 'Action: Gmail \u2192 Send Email', 'doublescale' ) ],
	},
];
const DirectionCard: React.FC< {
	outbound: boolean;
	title: string;
	blurb: string;
	here: string;
	there: string;
} > = ( { outbound, title, blurb, here, there } ) => {
	const Icon = outbound ? ArrowRight : ArrowLeft;
	const accent = outbound
		? 'border-l-primary'
		: 'border-l-amber-500 dark:border-l-amber-400';

	return (
		<div
			className={ `rounded-lg border border-l-4 ${ accent } bg-card p-4 space-y-3` }
		>
			<div className="flex items-center gap-2">
				<Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
				<h4 className="text-sm font-semibold">{ title }</h4>
			</div>
			<p className="text-sm text-muted-foreground">{ blurb }</p>
			<dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
				<dt className="text-muted-foreground">
					{ __( 'In DoubleScale', 'doublescale' ) }
				</dt>
				<dd className="font-medium">{ here }</dd>
				<dt className="text-muted-foreground">
					{ __( 'In Zapier', 'doublescale' ) }
				</dt>
				<dd className="font-medium">{ there }</dd>
			</dl>
		</div>
	);
};

/**
 * The two apps a Zap joins, shown as overlapping logos — DoubleScale first for
 * recipes that start here, the partner first for ones that end here, matching
 * the order the Zap actually runs in.
 */
const AppPair: React.FC< { template: Template; assetsUrl: string } > = ( {
	template,
	assetsUrl,
} ) => {
	const partnerLogo = PARTNER_LOGOS[ template.partnerApp ];

	// The shared brand mark, not a bundled file: it takes a `color`, so it stays
	// legible on the card whichever theme the admin is in.
	// The mark is two-tone white-on-transparent, drawn for the dark sidebar, so
	// it needs a dark plate here the same way the navbar gives it one. Tinting
	// it to a single colour instead would flatten the brand.
	const ours = (
		<span className="flex h-7 w-7 items-center justify-center rounded bg-[#2D1B69]">
			<LogoIcon width={ 16 } height={ 16 } />
		</span>
	);
	const theirs = partnerLogo ? (
		<img
			src={ `${ assetsUrl }${ partnerLogo }` }
			alt={ template.partnerLabel }
			className="h-7 w-7 rounded border bg-background object-contain p-0.5"
		/>
	) : null;

	return (
		<div className="flex shrink-0 items-center -space-x-1.5" aria-hidden>
			{ template.outbound ? ours : theirs }
			{ template.outbound ? theirs : ours }
		</div>
	);
};

const TemplateCard: React.FC< {
	template: Template;
	assetsUrl: string;
} > = ( { template, assetsUrl } ) => (
	<div className="rounded-lg border bg-card p-4 space-y-3">
		<div className="flex flex-wrap items-start justify-between gap-2">
			<div className="flex flex-wrap items-center gap-2">
				<AppPair template={ template } assetsUrl={ assetsUrl } />
				<h4 className="text-sm font-semibold">{ template.title }</h4>
				<span className="text-xs text-muted-foreground">
					{ template.outbound
						? sprintf(
								/* translators: %s: partner app name, e.g. Slack */
								__( 'DoubleScale + %s', 'doublescale' ),
								template.partnerLabel
						  )
						: sprintf(
								/* translators: %s: partner app name, e.g. Typeform */
								__( '%s + DoubleScale', 'doublescale' ),
								template.partnerLabel
						  ) }
				</span>
			</div>
			<a
				href={ buildZapUrl( template ) }
				target="_blank"
				rel="noopener noreferrer"
				className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
			>
				{ __( 'Use this workflow', 'doublescale' ) }
				<ExternalLinkIcon
					width={ 24 }
					height={ 24 }
					className="h-3.5 w-3.5 shrink-0"
					aria-hidden
				/>
			</a>
		</div>
		<p className="text-sm text-muted-foreground">{ template.summary }</p>
		<div className="flex flex-wrap items-center gap-2 text-sm">
			{ /* A Zap runs trigger first: outbound recipes start in DoubleScale,
			     inbound ones start in the partner app. */ }
			{ ( template.outbound
				? [ ...template.here, ...template.there ]
				: [ ...template.there, ...template.here ]
			).map( ( step, index ) => (
					<Fragment key={ step }>
						{ index > 0 && (
							<ArrowRight
								className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
								aria-hidden
							/>
						) }
						<span className="rounded-md bg-muted/60 px-2 py-1">
							{ step }
						</span>
					</Fragment>
				) ) }
		</div>
	</div>
);

const ZapierInstructions: React.FC = () => {
	const [ tab, setTab ] = useState< 'setup' | 'templates' >( 'setup' );
	const assetsUrl = `${ ConfigAPI.getPluginDirUrl().replace(
		/\/?$/,
		'/'
	) }assets/images/`;
	const logoUrl = `${ assetsUrl }zapier/zapier.svg`;
	const templates = getTemplates();
	const categoryLabels = getCategoryLabels();

	const tabClass = ( active: boolean ) =>
		`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
			active
				? 'border-primary text-primary'
				: 'border-transparent text-muted-foreground hover:text-foreground'
		}`;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4 pb-2">
				<img
					src={ logoUrl }
					alt={ __( 'Zapier', 'doublescale' ) }
					className="h-10 w-auto object-contain rounded"
				/>
				<h2 className="text-xl font-semibold text-destructive">
					{ __( 'Zapier Instructions:', 'doublescale' ) }
				</h2>
			</div>

			<div className="flex gap-6 border-b">
				<button
					type="button"
					onClick={ () => setTab( 'setup' ) }
					className={ tabClass( tab === 'setup' ) }
					aria-current={ tab === 'setup' ? 'page' : undefined }
				>
					{ __( 'How it works', 'doublescale' ) }
				</button>
				<button
					type="button"
					onClick={ () => setTab( 'templates' ) }
					className={ tabClass( tab === 'templates' ) }
					aria-current={ tab === 'templates' ? 'page' : undefined }
				>
					{ __( 'Example Templates', 'doublescale' ) }
				</button>
			</div>

			{ tab === 'setup' ? (
				<div className="space-y-4">
					<p className="text-base font-semibold text-foreground">
						{ __(
							'DoubleScale is a published Zapier app, so you connect it inside Zapier — there is nothing to set up on this screen.',
							'doublescale'
						) }
					</p>

					<div>
						<h3 className="mb-2 text-sm font-semibold">
							{ __( 'How a Zap is put together', 'doublescale' ) }
						</h3>
						<ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
							<li>
								{ __(
									'A Zap is one sentence: when something happens in one app, do something in another. The first half is the trigger, the second is the action.',
									'doublescale'
								) }
							</li>
							<li>
								{ __(
									'Open the Example Templates tab and pick the one closest to what you want, or start from scratch in',
									'doublescale'
								) }{ ' ' }
								<ExternalHref href={ ZAPIER_HOME_URL }>
									{ __( 'Zapier', 'doublescale' ) }
								</ExternalHref>
								{ ' ' }
								{ __( 'and search for DoubleScale.', 'doublescale' ) }
							</li>
							<li>
								{ __(
									'The first time you use DoubleScale in a Zap, Zapier asks you to sign in and connect this site. You only do this once.',
									'doublescale'
								) }
							</li>
							<li>
								{ __(
									'Map the fields Zapier shows you, run the test, then turn the Zap on.',
									'doublescale'
								) }
							</li>
						</ol>
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						<DirectionCard
							outbound
							title={ __( 'DoubleScale starts the Zap', 'doublescale' ) }
							blurb={ __(
								'Something happens here and another app should react.',
								'doublescale'
							) }
							here={ __( 'Deal Created, Invoice Paid, Ticket Created …', 'doublescale' ) }
							there={ __( 'Any of 7,000+ apps', 'doublescale' ) }
						/>
						<DirectionCard
							outbound={ false }
							title={ __( 'DoubleScale finishes the Zap', 'doublescale' ) }
							blurb={ __(
								'Something happens elsewhere and DoubleScale should record it.',
								'doublescale'
							) }
							here={ __( 'Create Contact, Add Deal, Add Tags …', 'doublescale' ) }
							there={ __( 'Any of 7,000+ apps', 'doublescale' ) }
						/>
					</div>

					<div className="rounded-lg border bg-card p-4 space-y-1">
						<p className="text-sm font-semibold">
							{ __( 'Narrow the trigger', 'doublescale' ) }
						</p>
						<p className="text-sm text-muted-foreground">
							{ __(
								'Zapier charges a task for every event a Zap receives. Use the trigger\u2019s own options — pipeline, stage, list — so it only fires on what you actually care about.',
								'doublescale'
							) }
						</p>
					</div>

					<div className="rounded-lg border bg-card p-4 space-y-1">
						<p className="text-sm font-semibold">
							{ __( 'Watch the currency', 'doublescale' ) }
						</p>
						<p className="text-sm text-muted-foreground">
							{ __(
								'Deals and invoices each keep their own currency. If a Zap totals amounts — into a spreadsheet, say — map the currency field too, or it will add different currencies together.',
								'doublescale'
							) }
						</p>
					</div>
				</div>
			) : (
				<div className="space-y-4">
					<p className="text-sm text-muted-foreground">
						{ __(
							'Ready-made Zaps. "Use this workflow" opens Zapier with both steps already chosen — connect your accounts and turn it on.',
							'doublescale'
						) }
					</p>
					{ CATEGORY_ORDER.map( ( category ) => {
						const inCategory = templates.filter(
							( template ) => template.category === category
						);

						if ( ! inCategory.length ) {
							return null;
						}

						return (
							<div key={ category } className="space-y-3">
								<h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									{ categoryLabels[ category ] }
								</h3>
								{ inCategory.map( ( template ) => (
									<TemplateCard
										key={ template.title }
										template={ template }
										assetsUrl={ assetsUrl }
									/>
								) ) }
							</div>
						);
					} ) }
				</div>
			) }
		</div>
	);
};

export default ZapierInstructions;
