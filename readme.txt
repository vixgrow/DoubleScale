=== DoubleScale | All-In-One Business Growth Platform ===
Contributors: vixgrowy
Tags:  crm, marketing automation, email campaigns, booking, pipelines
Requires at least: 5.8
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

WordPress-native CRM, deals & pipelines, email/SMS/WhatsApp campaigns, sequences, booking, helpdesk, tasks, SMTP, and visual automations — in one plugin.

== Description ==

**DoubleScale is the operating system for a WordPress-native business.** It replaces the stack most teams cobble together — CRM + Mailchimp + Calendly + ClickUp + a transactional email provider + a helpdesk + a reporting dashboard — with **one plugin** that lives inside wp-admin and stores everything in your own database.

You shouldn't need eight separate logins, eight billing relationships, and eight half-broken integrations to run a small business. DoubleScale unifies them around a single contact record, so a form submit can fire an automation, book a meeting, open a support thread, score the lead, alert the assigned rep, and send the receipt — all from the same data model.

= What's inside one plugin =

DoubleScale is a single install that gives you **nine first-class modules**, every one designed to feel like a dedicated product:

**1. CRM — contacts, lists, segmentation, activity timeline**
A complete contact database. Unlimited records, unlimited custom fields. Tag-based and rule-based segmentation, bulk operations, and CSV / WordPress user / WooCommerce imports. Every contact has a **full activity timeline** that stitches together emails, SMS and WhatsApp messages, deal stage changes, bookings, support threads, page visits, form submissions, link clicks, and automation runs — one chronological view per contact, no tab-switching.

**2. Deals & Pipelines — sales pipeline management**
Drag-and-drop kanban pipelines with multiple stages, weighted forecasting, win/loss reasons, and per-deal custom fields. Run separate pipelines for sales, partnerships, renewals, or onboarding. Every deal carries the full contact, activity, and email thread with it. Stage transitions can fire automations (move to "Closed Won" → send invoice + assign onboarding task + tag in CRM).

**3. Campaigns — email, SMS, and WhatsApp broadcasts and sequences**
A drag-and-drop email builder with responsive blocks, reusable templates, A/B testing, and merge tags for any custom field. Broadcast to lists, tags, or rule-based segments.
* **Email sequences (drip campaigns)** — multi-step nurture flows with time delays, conditional branches based on opens/clicks/replies, and goal-based exit conditions.
* **SMS campaigns** — broadcast and triggered SMS via Twilio. Shares the same composer, audience, and merge-tag system as email.
* **WhatsApp campaigns** — send Meta-approved WhatsApp templates and trigger conversations from the same builder. Inbound replies route to the unified inbox.
* Per-link tracking with automation triggers, bounce handling with soft/hard classification, and full delivery logs.

**4. Booking — self-service appointment scheduling**
Built-in calendar management with availability windows, guest forms, automated confirmations, rescheduling, time-zone handling, and embeddable booking pages. No external Calendly — bookings land directly on the contact record and can trigger automations.

**5. Tasks — team task management**
Create, assign, schedule, and track tasks. Link them to contacts and deals. Due dates, reminders, status workflows. Stop running a separate ClickUp or Asana when 80% of your tasks are about customers anyway.

**6. SMTP — multi-provider email routing**
A complete `wp_mail()` replacement with **20+ provider integrations** (SendGrid, Amazon SES, Mailgun, Postmark, SparkPost, SMTP.com, Gmail, MailerSend, Mailjet, Mandrill, Brevo, and more). Smart provider selection, automatic failover, full delivery logs, and email tests — your transactional and marketing email runs through the same hardened pipeline.

**7. Inbox — unified helpdesk across email, SMS, and WhatsApp**
A shared inbox for email, SMS, and WhatsApp conversations. Threads stay attached to the contact record. Assign threads to teammates, mark as read/unread, archive, and reply without leaving WordPress. IMAP polling brings inbound email replies straight into the inbox. Inbound WhatsApp and SMS messages can also fire automations — auto-tag, route to a teammate, open a deal, or kick off a follow-up sequence.

**8. Analytics — dashboards & reports**
A built-in reporting layer covering revenue, pipeline forecasts, campaign performance (opens, clicks, conversions per send), contact growth, automation execution, and email deliverability. Visual charts, KPI cards, custom date ranges, CSV exports. The numbers your founder, marketer, and ops lead all need — without exporting to a BI tool.

**9. Team management — roles, ownership, collaboration**
Multiple team members can work in DoubleScale at once. WordPress roles map to access patterns: sales reps see only deals they own, CRM managers see everything, support agents see the inbox. Activity is attributed by user. Notifications keep the team in sync.

= Plus: a visual automation engine that connects all nine =

Underneath every module is one workflow builder. **11+ trigger types** — form submitted, page visited, deal stage changed, link clicked, tag added, booking made, support thread opened, email received, SMS received, WhatsApp received, lead score crossed, list/tag applied or removed — flow into **multi-step automations** with conditional branches, time delays, goal conditions, and webhook calls. Actions include: send email, send SMS, send WhatsApp, start or pause an email sequence, tag, score, move a deal to a new stage, create a deal, assign a task, post to Slack, hit a webhook. This is the connective tissue that makes "all-in-one" actually mean something.

= Key capabilities =

* One contact record shared across every module — campaigns, bookings, tasks, helpdesk threads, and deals all attach to the same contact.
* Unlimited contacts and custom fields with no per-contact or per-seat fees.
* Self-hosted: all records live in your own WordPress database; no third-party cloud, no vendor lock-in.
* GDPR-friendly: per-contact exports, hard-delete workflows, consent tracking per channel, retention rules, and unsubscribe handling.
* Benchmarked at 100,000+ contacts on a single-server install. Background processing keeps the frontend fast.
* Deep WordPress integrations: WooCommerce, Easy Digital Downloads, SureCart, and LMS plugins (LearnDash, LifterLMS, LearnPress, Tutor LMS) feed the CRM natively.
* 16 form-builder integrations, including Contact Form 7, Gravity Forms, WPForms, Fluent Forms, Elementor Forms, Formidable, Forminator, Ninja Forms, MetForm, JetFormBuilder, Bit Forms, Sure Forms, and WS Form.

= Who DoubleScale is for =

Founders, agencies, marketers, course creators, e-commerce operators, and revenue teams who want **one WordPress-native operations platform** instead of stitching together eight SaaS subscriptions. From solo operators to organizations running 100k+ contacts — DoubleScale is built to scale with your business, not punish it with row-count surcharges.

Learn more at [doublescale.io](https://doublescale.io/).

== Source Code ==

This plugin includes compiled JavaScript and CSS in the `build/` directory. Human-readable source lives in `src/`.

**Public repository:** [DoubleScale on GitHub](https://github.com/Double-Scale/doublescale)

**Build from source**
1. Install Node.js (LTS recommended)
2. From the plugin directory: `npm install`
3. Production assets: `npm run build`
4. Development/watch: `npm run dev`

Outputs include client bundles under `build/`. Third-party libraries are listed in `package.json`.

**Lint / code standards**

The PHP code follows the WordPress Coding Standards (WPCS 3.x) with `WordPress-Extra` (security sniffs) and `PHPCompatibilityWP` enabled.

1. `composer install` — installs PHPCS, WPCS, and the rest of the dev tools.
2. `composer lint` — runs `phpcs --standard=phpcs.xml.dist` against `doublescale.php`, `includes/`, `bin/`, and `phpunit/`.
3. `composer format` — runs `phpcbf` to auto-fix what it can (whitespace, indentation, brace style).

For plugin-structure / readme / asset-organization checks, install the official [Plugin Check](https://wordpress.org/plugins/plugin-check/) plugin into a local WordPress install and run it via **Tools → Plugin Check**. Plugin Check is the same tool the WordPress.org review team runs.

== Installation ==

= Automatic =

1. In wp-admin go to **Plugins → Add New**
2. Search for **DoubleScale**
3. Install and activate
4. Open **DoubleScale** from the admin menu and complete onboarding

= Manual upload =

1. Download the plugin ZIP
2. **Plugins → Add New → Upload Plugin**
3. Activate **DoubleScale**

= After activation =

1. Review **DoubleScale → Settings**
2. Connect an SMTP provider (the SMTP module replaces `wp_mail()` immediately)
3. Import or sync contacts (CSV, WordPress users, or WooCommerce customers)
4. Create your first list, automation, booking calendar, or campaign

You'll have a working CRM + email engine + booking page in under 10 minutes.

== Frequently Asked Questions ==

= Is DoubleScale really an all-in-one replacement for CRM + deals/pipelines + email/SMS/WhatsApp campaigns + booking + tasks + SMTP + helpdesk + analytics + team management? =

Yes — that's exactly the design. Each module is built to feel like a dedicated product, but they share a single contact record, a single activity timeline, a single automation engine, a single reporting layer, and a single user model. You can install DoubleScale and turn off your CRM, Pipedrive/HubSpot, Mailchimp, Twilio dashboard, Calendly, SMTP plugin, helpdesk, and reporting tool on the same day.

= How is this different from "marketing automation" plugins like FluentCRM or Groundhogg? =

Most WordPress CRMs cover contacts + email + automation. DoubleScale covers that **plus** booking, tasks, a multi-channel helpdesk inbox, SMTP routing, and a full analytics layer — in the same plugin, around the same contact record. You're not bolting on FluentBooking + WP Mail SMTP + a separate helpdesk; it's all built in.

= Is there a contact limit? =

No. DoubleScale doesn't charge per contact. The free Starter plan handles unlimited contacts. Installs running 100,000+ contacts have been benchmarked.

= Where is my data stored? =

In your WordPress database. The CRM, deals, email content, support threads, and tracking events all live in tables on your server. Optional third-party services (SMTP providers, Twilio, etc.) are only used when you configure them yourself.

= Do you support WooCommerce? =

Yes — natively. Orders, customers, abandoned carts, and product purchases flow into the CRM. Trigger campaigns or automations from cart events. Set up abandoned-cart recovery in minutes.

= Can I send SMS or WhatsApp? =

Yes. SMS via Twilio and WhatsApp Business are available in Pro packages. Both share the same audience, composer, and merge-tag system as email.

= How does the booking module compare to Calendly? =

Same core experience — availability windows, embeddable booking pages, automated confirmations, time-zone handling. The difference: bookings land on the contact record, can trigger automations, and your data never leaves your install. Stripe payments and Google Calendar sync are Pro extensions.

= Does the helpdesk inbox replace Help Scout or Front? =

For most teams, yes. The unified inbox handles email, SMS, and WhatsApp threads with team assignment, status, and contact context. Heavy SLA / ticketing workflows may still warrant a dedicated helpdesk — but for support that lives next to sales and marketing data, this is a clean replacement.

= How does team management work? =

WordPress roles map to access patterns inside DoubleScale: sales reps see only deals they own, CRM managers see all deals and contacts, support agents see the inbox. Notifications, activity attribution, and ownership are user-aware throughout.

= Which form plugins work? =

16 form builders out of the box — Contact Form 7, Gravity Forms, WPForms, Fluent Forms, Elementor Forms, Formidable, Forminator, Ninja Forms, MetForm, JetFormBuilder, Bit Forms, Sure Forms, WS Form, and others. Form submissions create or update contacts with tags, lists, and field mapping.

= How do imports work? =

CSV imports, WordPress user sync, WooCommerce customer import, and connectors for popular CRMs (Pro). Field mapping with preview, error handling, and dry-run mode.

= Does DoubleScale slow down the public site? =

No. The frontend impact is minimal — heavy work (campaign sends, automation processing, tracking ingestion) runs in the admin and in background tasks (Action Scheduler).

= Can my team collaborate in DoubleScale? =

Yes. Multiple users can work simultaneously, with role-based access, ownership-aware filtering (e.g., sales rep view), and in-app notifications.

= How do I get help? =

Documentation and setup guides: [doublescale.io](https://doublescale.io). Community support via WordPress.org. Pro tiers include email and priority support.

== Changelog ==

= 1.0.0 =
* All-in-one launch — nine first-class modules in one plugin:
  * CRM with full activity timeline (emails, SMS, WhatsApp, deals, bookings, pageviews, form submits, automations — one chronological view)
  * Deals & pipelines (drag-and-drop kanban, weighted forecasting, multi-pipeline)
  * Email, SMS, and WhatsApp campaigns
  * Email sequences (drip campaigns) with delays, conditional branches, and goal-based exits
  * Booking (calendars, availability, embeddable pages)
  * Tasks (team task management linked to contacts and deals)
  * SMTP routing with 20+ providers and automatic failover
  * Unified inbox for email, SMS, and WhatsApp
  * Analytics, reports, and dashboards
* Visual automation engine with 11+ trigger types — including WhatsApp received, SMS received, deal stage changed, lead score crossed, link clicked — connecting every module
* 50+ integrations across WooCommerce, EDD, SureCart, LMS plugins, 16 form builders, SMTP providers, Twilio, Meta WhatsApp, Slack, HubSpot, Pipedrive, ActiveCampaign, and more

== Upgrade Notice ==

= 1.0.0 =
First stable release.

== Privacy Policy ==

DoubleScale stores CRM, campaign, booking, task, support, and analytics data in your WordPress database. The plugin does not transmit that core repository to DoubleScale servers by default.

Where you enable optional third-party integrations (SMTP providers, Twilio, Stripe, WhatsApp, Slack, ActiveCampaign, HubSpot, etc.), data flows are governed by those providers' terms — and only carry the fields you explicitly map. You can disable any connector by removing credentials or turning off related automations.

Privacy-minded operators have access to: per-contact GDPR exports, hard-delete workflows, consent tracking per channel, retention rules for tracking data, and unsubscribe handling for every send.

== External Services ==

DoubleScale connects to external services **only when you configure** those integrations. No data is transmitted without your API keys, OAuth grants, or explicit provider setup. Each provider listed below is independent of DoubleScale; using one means you also agree to that provider's terms and privacy policy.

For every service below:

* **Endpoint** — API base URL used after you save credentials (not a public marketing or documentation page; it may not load in a browser).
* **Terms** / **Privacy** — Public legal pages for that provider. These are the URLs WordPress reviewers and site owners should open to read each service's policies.

= AI services =

**OpenAI (optional)**
* Purpose: AI-assisted email composition and template generation.
* Data sent: The prompt text and any campaign content you submit through the AI builder. Sent only when you click an AI generate action.
* Endpoint: `https://api.openai.com`
* Terms: https://openai.com/policies/terms-of-use
* Privacy: https://openai.com/policies/privacy-policy

**Google Gemini (optional)**
* Purpose: Alternative AI provider for email composition.
* Data sent: Prompt text and campaign content, only when you click an AI generate action.
* Endpoint: `https://generativelanguage.googleapis.com`
* Terms: https://policies.google.com/terms
* Privacy: https://policies.google.com/privacy

= SMTP / email providers =

Each SMTP provider is selectable per connection. When you configure one, DoubleScale sends outgoing mail (email content, recipient addresses, headers) to that provider's API; nothing is sent until you save credentials.

**SendGrid**
* Endpoint: `https://api.sendgrid.com`
* Terms: https://www.twilio.com/legal/tos · Privacy: https://www.twilio.com/legal/privacy

**Mailgun**
* Endpoint: `https://api.mailgun.net`
* Terms: https://www.mailgun.com/terms · Privacy: https://www.mailgun.com/privacy-policy

**Postmark**
* Endpoint: `https://api.postmarkapp.com`
* Terms: https://postmarkapp.com/terms-of-service · Privacy: https://postmarkapp.com/privacy-policy

**SparkPost**
* Endpoint: `https://api.sparkpost.com`
* Terms: https://www.sparkpost.com/legal/terms-of-use · Privacy: https://bird.com/en/legal/privacy

**SMTP.com**
* Endpoint: `https://api.smtp.com`
* Terms: https://smtp.com/terms-of-service · Privacy: https://smtp.com/privacy-policy

**SMTP2GO**
* Endpoint: `https://api.smtp2go.com`
* Terms: https://www.smtp2go.com/terms/ · Privacy: https://www.smtp2go.com/privacy/

**MailerSend**
* Endpoint: `https://api.mailersend.com`
* Terms: https://www.mailersend.com/legal/terms-of-use · Privacy: https://www.mailersend.com/legal/privacy-policy

**Mailjet**
* Endpoint: `https://api.mailjet.com`
* Terms: https://www.mailjet.com/legal/terms · Privacy: https://www.mailjet.com/privacy-policy/

**Brevo (formerly Sendinblue)**
* Endpoint: `https://api.brevo.com`
* Terms: https://www.brevo.com/legal/termsofuse/ · Privacy: https://www.brevo.com/legal/privacypolicy/

**Mandrill**
* Endpoint: `https://mandrillapp.com/api`
* Terms: https://mailchimp.com/legal/terms/ · Privacy: https://mailchimp.com/legal/privacy/

**ElasticEmail**
* Endpoint: `https://api.elasticemail.com`
* Terms: https://elasticemail.com/resources/usage-policies/terms-of-use/ · Privacy: https://elasticemail.com/resources/usage-policies/privacy-policy/

**SendLayer**
* Endpoint: `https://console.sendlayer.com/api`
* Terms: https://sendlayer.com/terms-of-service/ · Privacy: https://sendlayer.com/privacy-policy/

**SocketLabs**
* Endpoint: `https://inject.socketlabs.com`
* Terms: https://www.socketlabs.com/terms-of-use · Privacy: https://www.socketlabs.com/privacy-policy/

**Loops**
* Endpoint: `https://app.loops.so/api`
* Terms: https://loops.so/terms · Privacy: https://loops.so/privacy

**Amazon SES**
* Endpoint: AWS regional endpoints (e.g., `https://email.us-east-1.amazonaws.com`)
* Terms: https://aws.amazon.com/service-terms/ · Privacy: https://aws.amazon.com/privacy/

= OAuth-based mail providers =

**Gmail / Google Workspace**
* Purpose: Send mail through your Google account via OAuth.
* Data sent: Outgoing email content; profile email read on connect to identify the account.
* Endpoints: `https://www.googleapis.com/oauth2/*`, `https://gmail.googleapis.com`
* Terms: https://policies.google.com/terms · Privacy: https://policies.google.com/privacy

**Microsoft Outlook / 365**
* Purpose: Send mail through your Microsoft account via OAuth.
* Data sent: Outgoing email content; profile read on connect to identify the account.
* Endpoints: `https://login.microsoftonline.com`, `https://graph.microsoft.com`
* Terms: https://www.microsoft.com/legal/terms-of-use · Privacy: https://privacy.microsoft.com/privacystatement

**Zoho Mail**
* Purpose: Send mail through your Zoho account via OAuth.
* Endpoints: `https://accounts.zoho.com`, `https://mail.zoho.com/api`
* Terms: https://www.zoho.com/terms.html · Privacy: https://www.zoho.com/privacy.html

= CRM sync providers (Pro) =

**ActiveCampaign**
* Purpose: Two-way contact sync.
* Data sent: Contact fields you map.
* Endpoint: Your account's ActiveCampaign API host.
* Terms: https://www.activecampaign.com/legal/terms-of-service · Privacy: https://www.activecampaign.com/legal/privacy-policy

**HubSpot**
* Purpose: Two-way contact and deal sync.
* Endpoint: `https://api.hubapi.com`
* Terms: https://legal.hubspot.com/terms-of-service · Privacy: https://legal.hubspot.com/privacy-policy

**Pipedrive**
* Purpose: Two-way contact and deal sync.
* Endpoint: `https://api.pipedrive.com`
* Terms: https://www.pipedrive.com/en/terms-of-service · Privacy: https://www.pipedrive.com/en/privacy

**GoHighLevel**
* Purpose: Contact sync via OAuth.
* Endpoints: `https://marketplace.gohighlevel.com`, `https://services.leadconnectorhq.com`
* Terms: https://www.gohighlevel.com/terms-of-service · Privacy: https://www.gohighlevel.com/privacy-policy

= Messaging providers (Pro) =

**Twilio**
* Purpose: SMS sending and inbound conversations.
* Data sent: Phone numbers and message content.
* Endpoint: `https://api.twilio.com`
* Terms: https://www.twilio.com/legal/tos · Privacy: https://www.twilio.com/legal/privacy

**Meta WhatsApp Business**
* Purpose: WhatsApp sending and inbound conversations.
* Data sent: Phone numbers and message content via the WhatsApp Business Cloud API.
* Endpoint: `https://graph.facebook.com`
* Terms: https://www.whatsapp.com/legal/business-terms · Privacy: https://www.whatsapp.com/legal/business-data-transfer-addendum

= Payments (Pro) =

**Stripe**
* Purpose: Process booking payments.
* Data sent: Booking amount, currency, and the payer email for receipts.
* Endpoint: `https://api.stripe.com`
* Terms: https://stripe.com/legal · Privacy: https://stripe.com/privacy

= Plugin-specific services =

**DoubleScale (doublescale.io)**
* Purpose: License validation, Pro add-on store, and update checks. This is the plugin's own service.
* Data sent: Your site URL, environment type (e.g. `production`/`staging`), and — only when you initiate a license or add-on action — the license key, the add-on identifier you selected, and your DoubleScale account credentials. No CRM, contact, or campaign data is sent.
* When it fires: Only on explicit user actions — activating a Pro license, browsing the Pro add-on store from the admin, or running an update check. Not on every page load.
* Endpoint: `https://doublescale.io`
* Terms: https://doublescale.io/terms · Privacy: https://doublescale.io/privacy

**UI Avatars (ui-avatars.com)** (Gravatar fallback)
* Purpose: Provides a generated initials-based avatar image for contacts whose email address has no Gravatar. DoubleScale outputs a standard Gravatar URL in the contact metabox; Gravatar itself redirects to UI Avatars when no Gravatar exists for the email, so the user's browser — not the plugin server — loads the fallback image.
* Data sent: Only the contact's display name (passed in the URL path so an initials-based image can be generated). The plugin does not POST or contact UI Avatars directly.
* When it fires: When an admin views the contact metabox and the contact has no Gravatar.
* Endpoint: `https://ui-avatars.com/api/`
* Terms: https://ui-avatars.com/terms · Privacy: https://ui-avatars.com/privacy

= AI provider endpoints (optional, bring-your-own-key) =

The AI settings page lets you point DoubleScale at any OpenAI-compatible endpoint by entering its base URL and your own API key. Suggested endpoints (Groq, OpenRouter) appear as labels in the provider dropdown but are **not** contacted unless you save credentials for them. If you configure an AI provider, you are responsible for that provider's terms and privacy policy.

* OpenRouter — `https://openrouter.ai/api/v1` · Terms: https://openrouter.ai/terms · Privacy: https://openrouter.ai/privacy
* Groq — `https://api.groq.com/openai/v1` · Terms: https://groq.com/terms-of-use · Privacy: https://groq.com/privacy-policy
* Any other OpenAI-compatible endpoint you supply manually.

= Disabling =

Disable any connector by removing its credentials in **DoubleScale → Settings** or by deactivating the related automation. Outgoing API calls only happen when you trigger an action that requires the configured service.

== Credits ==

* **Website & documentation:** [doublescale.io](https://doublescale.io)

== Support ==

* **Website & documentation:** [doublescale.io](https://doublescale.io)
* **WordPress.org support:** https://wordpress.org/support/plugin/doublescale/ (when the plugin listing is public)

== Contribute ==

Bug reports, ideas, and pull requests are welcome on the public GitHub repository linked in the **Source Code** section.

== Languages ==

DoubleScale is translation-ready. English ships by default; additional locales welcome via community contributions.
