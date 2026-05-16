=== DoubleScale ===
Contributors: vixgrowy
Tags: crm, marketing automation, booking, email campaigns, helpdesk
Requires at least: 5.8
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

WordPress-native CRM, campaigns, booking, SMTP, helpdesk, tasks, analytics, and automations in one plugin.

== Description ==

**DoubleScale is the operating system for a WordPress-native business.** It replaces the stack most teams cobble together — CRM + Mailchimp + Calendly + ClickUp + a transactional email provider + a helpdesk + a reporting dashboard — with **one plugin** that lives inside wp-admin and stores everything in your own database.

You shouldn't need eight separate logins, eight billing relationships, and eight half-broken integrations to run a small business. DoubleScale unifies them around a single contact record, so a form submit can fire an automation, book a meeting, open a support thread, score the lead, alert the assigned rep, and send the receipt — all from the same data model.

= What's inside one plugin =

DoubleScale is a single install that gives you **eight first-class modules**, every one designed to feel like a dedicated product:

**1. CRM — contacts, lists, segmentation**
A complete contact database. Unlimited records, unlimited custom fields. Tag-based and rule-based segmentation, full activity timeline, bulk operations, and CSV / WordPress user / WooCommerce imports. Every email, SMS, deal, booking, support ticket, and form submission stitches into one timeline per contact.

**2. Campaigns — email & SMS broadcasts and sequences**
A drag-and-drop email builder with responsive blocks, reusable templates, and merge tags for any custom field. Broadcast to lists, tags, or rule-based segments. Build multi-step email sequences (drip campaigns) with delays and conditional branches. SMS campaigns share the same composer and audience. Per-link tracking with automation triggers; bounce handling with soft/hard classification.

**3. Booking — self-service appointment scheduling**
Built-in calendar management with availability windows, guest forms, automated confirmations, rescheduling, time-zone handling, and embeddable booking pages. No external Calendly — bookings land directly on the contact record and can trigger automations.

**4. Tasks — team task management**
Create, assign, schedule, and track tasks. Link them to contacts and deals. Due dates, reminders, status workflows. Stop running a separate ClickUp or Asana when 80% of your tasks are about customers anyway.

**5. SMTP — multi-provider email routing**
A complete `wp_mail()` replacement with **20+ provider integrations** (SendGrid, Amazon SES, Mailgun, Postmark, SparkPost, SMTP.com, Gmail, MailerSend, Mailjet, Mandrill, Brevo, and more). Smart provider selection, automatic failover, full delivery logs, and email tests — your transactional and marketing email runs through the same hardened pipeline.

**6. Helpdesk inbox — unified support across channels**
A shared inbox for email, SMS, and WhatsApp conversations. Threads stay attached to the contact record. Assign threads to teammates, mark as read/unread, archive, and reply without leaving WordPress. IMAP polling brings inbound email replies straight into the inbox.

**7. Analytics — dashboards & reports**
A built-in reporting layer covering revenue, pipeline, campaign performance, contact growth, automation execution, and email deliverability. Visual charts, KPI cards, custom date ranges, CSV exports. The numbers your founder, marketer, and ops lead all need — without exporting CSVs to a BI tool.

**8. Team management — roles, ownership, collaboration**
Multiple team members can work in DoubleScale at once. WordPress roles map to access patterns: sales reps see their deals, CRM managers see everything, support agents see the inbox. Activity is attributed by user. Notifications keep the team in sync.

= Plus: a visual automation engine that connects all eight =

Underneath every module is one workflow builder. **11+ trigger types** — form submitted, page visited, deal stage changed, link clicked, tag added, booking made, support thread opened — flow into **multi-step automations** with conditional branches, time delays, and webhook calls. Actions include: send email, send SMS, tag, score, create a deal, assign a task, post to Slack, hit a webhook. This is the connective tissue that makes "all-in-one" actually mean something.

= Why teams replace 5+ SaaS subscriptions with DoubleScale =

* **One contact record, eight surfaces.** A new sign-up doesn't have to be synced across five tools — it's already everywhere.
* **No per-contact pricing. Ever.** Other CRMs charge by contact count. We charge by team plan. Run 200 contacts or 200,000 — same price.
* **Self-hosted, native to WordPress.** Your contact records, deals, email history, support threads, and tracking events all live in your WordPress database, on your server. No iframe, no third-party cloud, no vendor lock-in.
* **GDPR by design.** You control retention, exports, and deletion. No sub-processors. Tracking data stays inside your install.
* **Scalable.** Benchmarked at 100,000+ contacts on a single-server install. Background tasks keep the frontend fast.
* **Deep WordPress integrations.** WooCommerce, Easy Digital Downloads, SureCart, and 4 LMS platforms (LearnDash, LifterLMS, LearnPress, Tutor LMS) all feed the CRM natively.
* **16 form-builder integrations.** Contact Form 7, Gravity Forms, WPForms, Fluent Forms, Elementor Forms, Formidable, Forminator, Ninja Forms, MetForm, Quill Forms, JetFormBuilder, Bit Forms, Sure Forms, WS Form, and more.

= How DoubleScale compares to GoHighLevel and HubSpot =

Both platforms position themselves as "all-in-one." Both charge accordingly. Here's what their public pricing looks like alongside DoubleScale (as of 2026):

**GoHighLevel** — cloud-hosted, agency-oriented
* Starter: **$97 / month** — limited sub-accounts, contact caps per location, per-message SMS/email fees on top
* Unlimited: **$297 / month** — agency-tier with sub-account creation, still charges per-segment for email and per-segment for SMS
* SaaS Pro: **$497 / month** — adds resale features, still pays usage-based fees for every send
* What you don't own: your data sits on GHL infrastructure. Cancel = export and rebuild elsewhere.

**HubSpot** — cloud SaaS, contact-tiered
* Marketing Hub Professional: **$890 / month** for the first 2,000 marketing contacts — **price climbs as your contact list grows** (~$45 per additional 1,000 contacts at this tier)
* Sales Hub Professional: **$90 / seat / month** — billed per user
* Service Hub Professional: **$90 / seat / month** — billed per user
* Operations Hub Professional: **$720 / month**
* CMS Hub Professional: **$360 / month**
* **Marketing + Sales + Service + Ops Pro for a 5-person team starting at 2k contacts: ~$2,500 / month** — and that's before you grow.
* Enterprise tiers cross **$3,600 / month** before per-seat or per-contact surcharges.

**DoubleScale** — self-hosted WordPress plugin
* Starter (free, forever): unlimited contacts, email & SMS campaigns, automations, booking, SMTP, WooCommerce/EDD/LMS integrations
* Growth: **$99 / month, billed yearly** — adds deals & pipelines, tasks, lead scoring, forms, custom fields, Stripe for bookings
* Scale: **$199 / month, billed yearly** — adds the unified helpdesk inbox, full analytics, website tracking, push notifications, Twilio/WhatsApp, and CRM sync (HubSpot, ActiveCampaign, Pipedrive)
* **No per-contact pricing. No per-seat fees. Run 200 or 200,000 contacts at the same price.**

**Side-by-side, the same workload:**

A team with 5 users, 25,000 contacts, sending email & SMS campaigns, running pipelines, scheduling bookings, and managing customer support:

* GoHighLevel Unlimited: **~$297 / month** + per-send usage fees (typically $50–$200 extra)
* HubSpot Marketing Pro + Sales Pro + Service Pro: **~$1,840 / month** at 25k contacts (Marketing Hub Pro alone bills ~$1,400/mo at that contact count, plus seats)
* **DoubleScale Scale: $199 / month — your data, your server, unlimited contacts, every module included**

The trade-off is honest: HubSpot and GoHighLevel are hosted SaaS, polished, and require zero infrastructure. DoubleScale lives in your WordPress install — which means a few minutes of setup, a hosting bill you already pay, and a one-time decision to keep your customer data on your own servers.

*Pricing references: hubspot.com/pricing, gohighlevel.com/pricing. Verify current rates on their respective sites; both vendors adjust pricing periodically.*

= What you can throw away after installing DoubleScale =

* Your standalone CRM (HubSpot, Pipedrive, ActiveCampaign)
* Your email marketing platform (Mailchimp, ConvertKit, Klaviyo)
* Your transactional email plugin (WP Mail SMTP, FluentSMTP)
* Your booking app (Calendly, Acuity, SimplyBook)
* Your task tracker (for customer work — ClickUp, Asana, Trello)
* Your reporting layer (Databox, custom BI dashboards)
* Your automation glue (Zapier — for anything happening inside your WordPress site)

= Who DoubleScale is for =

Founders, agencies, marketers, course creators, e-commerce operators, and revenue teams who want **one WordPress-native operations platform** instead of stitching together eight SaaS subscriptions. From solo operators to organizations running 100k+ contacts — DoubleScale is built to scale with your business, not punish it with row-count surcharges.

= Integrations =

**Commerce:** WooCommerce, Easy Digital Downloads, SureCart
**Forms (16):** Contact Form 7, Elementor Forms, Fluent Forms, Formidable, Forminator, Gravity Forms, JetFormBuilder, MetForm, Ninja Forms, WPForms, WS Form, Sure Forms, Bit Forms, Quill Forms, and others
**LMS:** LearnDash, LifterLMS, LearnPress, Tutor LMS
**SMTP providers (20+):** SendGrid, Amazon SES, Mailgun, Postmark, SparkPost, SMTP.com, Gmail, MailerSend, Mailjet, Mandrill, Brevo, Pepipost, Sendinblue, SendLayer, and more
**Messaging (Pro):** Twilio (SMS), Meta WhatsApp Business, Slack
**CRM sync (Pro):** ActiveCampaign, HubSpot, Pipedrive, Keap, Mautic, Ontraport
**Email platforms (Pro):** Mailchimp, MailerLite, ConvertKit, GetResponse, Drip, Klaviyo
**Calendars (Pro):** Google Calendar, Outlook
**Payments (Pro):** Stripe (for bookings and transactions)
**Webhooks & API:** Zapier-compatible, native webhooks, REST endpoints

Learn more at [doublescale.io](https://doublescale.io/).

== Source Code ==

This plugin includes compiled JavaScript and CSS in the `build/` directory. Human-readable source lives in `src/`.

**Public repository:** [DoubleScale on GitHub](https://github.com/DoubleScale/DoubleScale)

**Build from source**
1. Install Node.js (LTS recommended)
2. From the plugin directory: `npm install`
3. Production assets: `npm run build`
4. Development/watch: `npm run dev`

Outputs include client bundles under `build/`. Third-party libraries are listed in `package.json`.

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

= Is DoubleScale really an all-in-one replacement for CRM + email + booking + tasks + SMTP + helpdesk + analytics + team management? =

Yes — that's exactly the design. Each module is built to feel like a dedicated product, but they share a single contact record, a single automation engine, a single reporting layer, and a single user model. You can install DoubleScale and turn off your CRM, Mailchimp, Calendly, SMTP plugin, helpdesk, and reporting tool on the same day.

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

16 form builders out of the box — Contact Form 7, Gravity Forms, WPForms, Fluent Forms, Elementor Forms, Formidable, Forminator, Ninja Forms, MetForm, Quill Forms, JetFormBuilder, Bit Forms, Sure Forms, WS Form, and others. Form submissions create or update contacts with tags, lists, and field mapping.

= How do imports work? =

CSV imports, WordPress user sync, WooCommerce customer import, and connectors for popular CRMs (Pro). Field mapping with preview, error handling, and dry-run mode.

= Does DoubleScale slow down the public site? =

No. The frontend impact is minimal — heavy work (campaign sends, automation processing, tracking ingestion) runs in the admin and in background tasks (Action Scheduler).

= Can my team collaborate in DoubleScale? =

Yes. Multiple users can work simultaneously, with role-based access, ownership-aware filtering (e.g., sales rep view), and in-app notifications.

= How do I get help? =

Documentation: [doublescale.io/docs](https://doublescale.io/docs). Community support via WordPress.org. Pro tiers include email and priority support.

== Changelog ==

= 1.0.0 =
* All-in-one launch: CRM, email & SMS campaigns, booking, tasks, SMTP routing, unified helpdesk inbox, analytics, and team management — in one plugin
* Visual automation engine with 11+ trigger types connecting every module
* 50+ integrations across commerce, forms, LMS, SMTP, messaging, and CRM sync

== Upgrade Notice ==

= 1.0.0 =
First stable release.

== Privacy Policy ==

DoubleScale stores CRM, campaign, booking, task, support, and analytics data in your WordPress database. The plugin does not transmit that core repository to DoubleScale servers by default.

Where you enable optional third-party integrations (SMTP providers, Twilio, Stripe, WhatsApp, Slack, ActiveCampaign, HubSpot, etc.), data flows are governed by those providers' terms — and only carry the fields you explicitly map. You can disable any connector by removing credentials or turning off related automations.

Privacy-minded operators have access to: per-contact GDPR exports, hard-delete workflows, consent tracking per channel, retention rules for tracking data, and unsubscribe handling for every send.

== External Services ==

DoubleScale connects to external services **only when you configure** those integrations. No data is transmitted without your API keys, webhooks, or explicit provider setup.

**ActiveCampaign (optional)**
* Purpose: Contact sync
* Data: Contact fields you map
* Provider: ActiveCampaign LLC — account-specific API host
* Terms: https://www.activecampaign.com/legal/terms-of-service
* Privacy: https://www.activecampaign.com/legal/privacy-policy

**HubSpot (optional)**
* Purpose: Contact and deal sync
* Provider: HubSpot, Inc. — `https://api.hubapi.com`
* Terms: https://legal.hubspot.com/terms-of-service
* Privacy: https://legal.hubspot.com/privacy-policy

**Twilio (optional, Pro)**
* Purpose: SMS sending and inbound conversations
* Data: Phone numbers, message content
* Provider: Twilio Inc. — `https://api.twilio.com`
* Terms: https://www.twilio.com/legal/tos
* Privacy: https://www.twilio.com/legal/privacy

**Stripe (optional, Pro)**
* Purpose: Booking payments
* Provider: Stripe, Inc. — `https://api.stripe.com`
* Terms: https://stripe.com/legal
* Privacy: https://stripe.com/privacy

**SMTP providers (optional)**
SendGrid, Amazon SES, Mailgun, Postmark, SparkPost, SMTP.com, Gmail, MailerSend, Mailjet, Mandrill, Brevo, and others — each governed by their own terms and privacy policy. Configured per-connection with your own credentials.

Disable any connector by removing credentials or turning off the related automations. Using a provider means you agree to their agreements and privacy practices.

== Credits ==

* **Website:** [doublescale.io](https://doublescale.io)
* **Documentation:** [doublescale.io/docs](https://doublescale.io/docs)

== Support ==

* **Docs:** [doublescale.io/docs](https://doublescale.io/docs)
* **Website:** [doublescale.io](https://doublescale.io)
* **WordPress.org support:** https://wordpress.org/support/plugin/doublescale/ (when the plugin listing is public)

== Contribute ==

Bug reports, ideas, and pull requests are welcome on the public GitHub repository linked in the **Source Code** section.

== Languages ==

DoubleScale is translation-ready. English ships by default; additional locales welcome via community contributions.
