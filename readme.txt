=== DoubleScale | All-In-One Business Growth Platform ===
Contributors: vixgrowy
Tags:  crm, marketing automation, email campaigns, booking, pipelines
Requires at least: 5.8
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.2.7
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

WordPress-native CRM, sales pipeline, email/SMS/WhatsApp campaigns, booking, helpdesk, tasks, SMTP, proposals, invoices and automations — one plugin.


== Description ==

**DoubleScale is the operating system for a WordPress-native business.** It replaces the stack most teams cobble together — CRM + Mailchimp + Calendly + ClickUp + a transactional email provider + a helpdesk + a reporting dashboard — with **one plugin** that lives inside wp-admin and stores everything in your own database.

You shouldn't need eight separate logins, eight billing relationships, and eight half-broken integrations to run a small business. DoubleScale unifies them around a single contact record, so a form submit can fire an automation, book a meeting, open a support thread, score the lead, alert the assigned rep, and send the receipt — all from the same data model.
**Live demo:** [try.doublescale.io](https://try.doublescale.io) · **Website:** [doublescale.io](https://doublescale.io) · **Documentation:** [doublescale.io/docs](https://doublescale.io/docs/)

= What's inside one plugin =

DoubleScale is a single install that gives you **nine first-class modules**, every one designed to feel like a dedicated product:

**1. CRM — contacts, lists, segmentation, activity timeline**
A complete contact database. Unlimited records, unlimited custom fields. Tag-based and rule-based segmentation, bulk operations, and CSV / WordPress user / WooCommerce imports. Every contact has a **full activity timeline** that stitches together emails, SMS and WhatsApp messages, deal stage changes, bookings, support threads, page visits, form submissions, link clicks, and automation runs — one chronological view per contact, no tab-switching.

**2. Sales — pipelines, documents, and recurring revenue**
Run your full revenue workflow from one Sales workspace in wp-admin — from first lead to signed contract, paid invoice, and recurring subscription.

* **Pipelines** — drag-and-drop kanban deal boards with multiple stages, weighted forecasting, win/loss reasons, and per-deal custom fields. Stage changes fire automations (move to "Closed Won" → send an invoice, assign a task, tag in CRM).
* **Proposals** — branded quotes with line items, customer acceptance, and one-click convert to invoice.
* **Invoices** — send, track, and collect payment online (Stripe and manual payments).
* **Contracts** — templated agreements with signatures and lifecycle automations.
* **Credit notes** — issue refunds and adjustments tied to invoices.
* **Taxes** — configure tax rates and apply them to proposal, contract, and invoice line items.
* **Subscriptions** — recurring billing and subscription management (Pro).
* **Client portal** — embeddable logged-in customer hub (`[doublescale_client_portal]`) where buyers view proposals and invoices, see outstanding balance, follow document lifecycle on a unified timeline, open contracts and credit notes (Pro), and manage subscriptions (Pro). Customers jump to secure public pages to accept proposals, pay invoices, or sign contracts; the portal aggregates sales documents alongside support tickets and bookings in one dashboard.

Every deal, document, and payment links to the same contact record, activity timeline, and automation engine.

**3. Campaigns — email, SMS, and WhatsApp broadcasts and sequences**
A drag-and-drop email builder with responsive blocks, reusable templates, A/B testing, and merge tags for any custom field. Broadcast to lists, tags, or rule-based segments.
* **Email sequences (drip campaigns)** — multi-step nurture flows with time delays, conditional branches based on opens/clicks/replies, and goal-based exit conditions.
* **SMS campaigns** — broadcast and triggered SMS via Twilio. Shares the same composer, audience, and merge-tag system as email.
* **WhatsApp campaigns** — send Meta-approved WhatsApp templates and trigger conversations from the same builder. Inbound replies route to the unified inbox.
* Per-link tracking with automation triggers, bounce handling with soft/hard classification, and full delivery logs.

**4. Booking — self-service appointment scheduling**
A full scheduling system inside WordPress — no Calendly needed. Create **single events** for one-on-one meetings (consultations, demos, coaching sessions) or **team events** where multiple staff members share availability and bookings are assigned via round-robin or manual selection. Configure slot durations, buffer times between appointments, and per-day availability windows. Guests pick a time from an embeddable booking page, fill out a customizable intake form, and receive automated email/SMS confirmations and reminders. Supports Stripe payment collection for paid bookings, waiting lists when slots fill up, rescheduling and cancellation flows, and automatic time-zone detection. Every booking lands on the contact record and can trigger automations (e.g., tag the contact, create a deal, send a follow-up sequence).

**5. Tasks — team task management**
Create, assign, schedule, and track tasks. Link them to contacts and deals. Due dates, reminders, status workflows. Stop running a separate ClickUp or Asana when 80% of your tasks are about customers anyway.

**6. SMTP — multi-provider email routing**
A complete `wp_mail()` replacement built into the CRM — no separate SMTP plugin required. Connect one or more of **20+ providers**: SendGrid, Amazon SES, Mailgun, Postmark, SparkPost, SMTP.com, SMTP2GO, Gmail (OAuth), Outlook (OAuth), Zoho (OAuth), MailerSend, Mailjet, Mandrill, Brevo (Sendinblue), Elastic Email, SendLayer, SocketLabs, Loops, and generic SMTP relay. Set up multiple connections with routing rules so transactional mail goes through one provider while marketing campaigns use another. OAuth authentication for Gmail, Outlook, and Zoho — no app passwords needed. Includes full email delivery logs, bounce handling with soft/hard classification, provider health checks, email test sending, and automatic failover when a provider is down.

**7. Support — ticket-based helpdesk with mailbox channels and customer portal**
A complete helpdesk built into your CRM. Customers open tickets via a self-service portal or by emailing a connected mailbox; agents reply, assign, tag, and resolve — all without leaving WordPress. Features include: multiple mailbox channels (web and IMAP), configurable email notifications with threading and subject tagging, file attachments with signed secure downloads, ticket priority and status workflows, CC management, bulk actions (assign, close, merge, tag), per-ticket activity logging, custom fields, saved replies, and a built-in reports dashboard. IMAP polling brings inbound emails straight into the agent inbox. Every ticket links to the contact record and can trigger automations — auto-tag, route to an agent, create a deal, or start a follow-up sequence.

**8. Analytics — dashboards & reports**
A built-in reporting layer covering revenue, pipeline forecasts, campaign performance (opens, clicks, conversions per send), contact growth, automation execution, and email deliverability. Visual charts, KPI cards, custom date ranges, CSV exports. The numbers your founder, marketer, and ops lead all need — without exporting to a BI tool.

**9. User roles — scoped access for sales, support, and booking teams**
DoubleScale ships **seven dedicated WordPress roles** (plus site administrators). Assign them under **Settings → Team**. Users can hold **multiple roles** — capabilities merge across roles.

**Sales (Pro)**

* **CRM Manager** — Full CRM admin: all contacts, deals, pipelines, settings, team, reports, import/export, and all proposals/invoices. Full Support inbox access without a separate support role.
* **Sales Manager** — All deals and contacts; import/export; all proposals and invoices. Support access requires an additional support role.
* **Sales Rep** — Own deals and contacts only; own proposals and invoices; create deals and log activities.

**Support**

* **Support Manager** — View and manage every support ticket; assign agents; reply on any thread.
* **Support Agent** — View the Support module; reply on tickets assigned to them.

**Booking**

* **Booking Manager** — Read and manage all calendars, bookings, and availability schedules across the team.
* **Booking Agent** — Manage only own calendars, bookings, and availability.

**Administrators**

* **WordPress Administrator** — Every DoubleScale capability automatically.

**Notes**

* CRM Manager, Sales Manager, and Sales Rep require **DoubleScale Pro**.
* Support and Booking roles are available when those modules are enabled.
* Disabling a module suspends its role capabilities; assignments are preserved when you turn the module back on.

= Plus: a visual automation engine that connects all nine =

Underneath every module is one workflow builder. **100+ triggers** across contacts, deals, forms, booking, support, messaging, e-commerce, LMS, and membership plugins — flow into **multi-step automations** with conditional branches, time delays, goal conditions, and webhook calls. Actions include: send email, send SMS, send WhatsApp, start or pause an email sequence, tag, score, move a deal to a new stage, create a deal, assign a task, post to Slack, hit a webhook.

**Automation integrations:**

* **E-commerce** — [WooCommerce](https://doublescale.io/integrations/woocommerce/) (orders, subscriptions, memberships, cart abandonment, reviews, wishlists), Easy Digital Downloads, SureCart
* **Forms** — [Contact Form 7](https://doublescale.io/integrations/contact-form-007/), [WPForms](https://doublescale.io/integrations/wpforms/), [Fluent Forms](https://doublescale.io/integrations/fluent-forms/), [Quill Forms](https://doublescale.io/integrations/quill-forms/) (free); [Elementor Forms](https://doublescale.io/integrations/elementor/), [Gravity Forms](https://doublescale.io/integrations/gravity-forms/), [Ninja Forms](https://doublescale.io/integrations/ninja-forms/), [Formidable](https://doublescale.io/integrations/formidable-forms/), [Forminator](https://doublescale.io/integrations/forminator-forms/), [MetForm](https://doublescale.io/integrations/metform/), [WS Form](https://doublescale.io/docs/), [Bit Form](https://doublescale.io/docs/), [SureForms](https://doublescale.io/docs/), [eForm](https://doublescale.io/docs/), [JetFormBuilder](https://doublescale.io/docs/) (Pro)
* **LMS** — [LearnDash](https://doublescale.io/integrations/learndash/), Tutor LMS, LifterLMS, LearnPress
* **Membership** — MemberPress, Paid Memberships Pro
* **Media** — Presto Player
* **Messaging** — Email received, SMS received, WhatsApp received
* **CRM** — Contact subscribed/unsubscribed, tags applied/removed, lists applied/removed, deal stage/status/owner/value changed, link trigger clicked, user login/register/role update, webhook received
* **Booking** — Booking created, confirmed, completed, rescheduled, cancelled
* **Support** — Ticket created, closed, reply added, note added, status changed, priority changed, agent assigned

= Key capabilities =

* **AI-powered writing and assistance** — Connect your own API key from OpenAI, Google Gemini, Groq, OpenRouter, or any OpenAI-compatible provider. AI-assisted email composition, smart template generation, subject line suggestions, and content rewriting are built right into the campaign builder and email editor. Bring your own key, pick your provider, and keep full control over cost and data.
* One contact record shared across every module — campaigns, bookings, tasks, helpdesk threads, and deals all attach to the same contact.
* Unlimited contacts and custom fields with no per-contact or per-seat fees.
* Self-hosted: all records live in your own WordPress database; no third-party cloud, no vendor lock-in.
* GDPR-friendly: per-contact exports, hard-delete workflows, consent tracking per channel, retention rules, and unsubscribe handling.
* Benchmarked at 100,000+ contacts on a single-server install. Background processing keeps the frontend fast.
* Deep WordPress integrations: WooCommerce, Easy Digital Downloads, SureCart, and LMS plugins (LearnDash, LifterLMS, LearnPress, Tutor LMS) feed the CRM natively.
* **15 form-builder integrations** — Contact Form 7, WPForms, Fluent Forms, Quill Forms (free); Elementor Forms, Gravity Forms, Ninja Forms, Formidable, Forminator, MetForm, WS Form, Bit Form, SureForms, eForm, and JetFormBuilder (Pro).

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

== Screenshots ==

1. **Dashboard** — Analytics overview with KPI cards, quick links, recent contacts, and contact analytics chart.
2. **Contact Details** — Full contact profile with activity timeline, channel subscriptions, lists, and tags.
3. **Email Builder** — Drag-and-drop campaign editor with responsive blocks, merge tags, and template library.
4. **Automation Builder** — Visual workflow editor with triggers, conditions, and branching actions.
5. **Booking Event Setup** — Configure event details, duration, color, location, and live preview.
6. **Booking Calendar** — Frontend booking page with date/time picker and automatic time-zone detection.
7. **SMTP Providers** — Choose from 20+ mail providers including SendGrid, Amazon SES, Gmail, Mailgun, and more.

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

Most WordPress CRMs cover contacts + email + automation. DoubleScale covers that **plus** booking, tasks, a multi-channel helpdesk inbox, SMTP routing, and a full analytics layer — in the same plugin, around the same contact record. You're not bolting on FluentBooking + WP Mail SMTP + a separate helpdesk; it's all built in. See the full [DoubleScale vs FluentCRM comparison](https://doublescale.io/compare/vs-fluentcrm/).

= Is there a contact limit? =

No. DoubleScale doesn't charge per contact. The free Starter plan handles unlimited contacts. Installs running 100,000+ contacts have been benchmarked.

= Where is my data stored? =

In your WordPress database. The CRM, deals, email content, support threads, and tracking events all live in tables on your server. Optional third-party services (SMTP providers, Twilio, etc.) are only used when you configure them yourself.

= Do you support WooCommerce? =

Yes — natively. Orders, customers, abandoned carts, and product purchases flow into the CRM. Trigger campaigns or automations from cart events. Set up abandoned-cart recovery in minutes. See the full [DoubleScale WooCommerce CRM integration guide](https://doublescale.io/integrations/woocommerce/).

= Can I send SMS or WhatsApp? =

Yes. SMS via Twilio and WhatsApp Business are available in Pro packages. Both share the same audience, composer, and merge-tag system as email.

= How does the booking module compare to Calendly? =

Same core experience — availability windows, embeddable booking pages, automated confirmations, time-zone handling. The difference: bookings land on the contact record, can trigger automations, and your data never leaves your install. Stripe payments and Google Calendar sync are Pro extensions.

= Does the helpdesk inbox replace Help Scout or Front? =

For most teams, yes. The unified inbox handles email, SMS, and WhatsApp threads with team assignment, status, and contact context. Heavy SLA / ticketing workflows may still warrant a dedicated helpdesk — but for support that lives next to sales and marketing data, this is a clean replacement.

= How does team management work? =

DoubleScale adds seven scoped WordPress roles — CRM Manager, Sales Manager, Sales Rep, Support Manager, Support Agent, Booking Manager, and Booking Agent — plus full access for site administrators. Sales reps see only their own deals; sales managers and CRM managers see the full pipeline; support agents see assigned tickets while support managers see the entire inbox; booking agents manage their own calendars while booking managers oversee the whole schedule. Users can combine roles, activity is attributed by user, and in-app notifications keep the team aligned. See **User roles** in the description above for the full capability matrix.

= Which form plugins work? =

15 form builders. Four ship in the free plugin — [Contact Form 7](https://doublescale.io/integrations/contact-form-007/), [WPForms](https://doublescale.io/integrations/wpforms/), [Fluent Forms](https://doublescale.io/integrations/fluent-forms/), and [Quill Forms](https://doublescale.io/integrations/quill-forms/). Eleven more are available with Pro — [Elementor Forms](https://doublescale.io/integrations/elementor/), [Gravity Forms](https://doublescale.io/integrations/gravity-forms/), [Ninja Forms](https://doublescale.io/integrations/ninja-forms/), [Formidable](https://doublescale.io/integrations/formidable-forms/), [Forminator](https://doublescale.io/integrations/forminator-forms/), [MetForm](https://doublescale.io/integrations/metform/), [WS Form](https://doublescale.io/docs/), [Bit Form](https://doublescale.io/docs/), [SureForms](https://doublescale.io/docs/), [eForm](https://doublescale.io/docs/), and [JetFormBuilder](https://doublescale.io/docs/). Form submissions create or update contacts with tags, lists, and field mapping.

= How do imports work? =

CSV imports, WordPress user sync, WooCommerce customer import, and connectors for popular CRMs (Pro). Field mapping with preview, error handling, and dry-run mode.

= Does DoubleScale slow down the public site? =

No. The frontend impact is minimal — heavy work (campaign sends, automation processing, tracking ingestion) runs in the admin and in background tasks (Action Scheduler).

= Can my team collaborate in DoubleScale? =

Yes. Multiple users can work simultaneously, with role-based access, ownership-aware filtering (e.g., sales rep view), and in-app notifications.

= How do I get help? =

Documentation and setup guides: [doublescale.io](https://doublescale.io). Community support via WordPress.org. Pro tiers include email and priority support.

== Changelog ==
= 1.2.7 = 30 Jun 2026
- Add sales document approval workflow with discount validation for proposals, contracts, and invoices
- Add sales rep permissions and read-only payment handling
- Add per-user list preferences for contacts, tags, and lists views
- Add optional email and phone support for contacts with unique phone and WhatsApp number enforcement
- Add Phone-as-WhatsApp setting for contact management
- Add WooCommerce order integration and revenue tracking on contact profiles
- Add WooCommerce customer import WhatsApp phone mapping
- Add EDD order status constants and improved revenue queries
- Add CRM contact creation option for abandoned cart recovery
- Add subscription management enhancements with public list visibility and list status
- Add ContactSubscribed goal and trigger improvements with subscription type handling
- Add automation trigger documentation callouts and featured trigger status
- Add booking access permission improvements and user role checks
- Add WhatsApp opt-out and resubscription keyword settings with enhanced unsubscribe messaging
- Improve webhook processing and result normalization
- Improve Checkbox and Radio custom field validation and sanitization
- Improve contact list column visibility, status display, and bulk list/tag modals
- Improve input, dialog, and email settings UI with focus management and consistent styling
- Improve WordPress.org readme with integration and comparison page links

= 1.2.6 = 24 Jun 2026
- Add PayPal payment gateway support for online invoice payments
- Improve Outlook SMTP connections with Microsoft Graph for inbound email retrieval
- Add email attachment handling and display in contact email activity
- Allow editing logged email activity from the contact timeline
- Improve phone number handling across contact management and import
- Revamp customer support portal ticket list and detail views
- Add ticket detail modal to the admin support inbox with CC recipient improvements
- Add contacts list column visibility preferences
- Add automation workflow duplication and step duplicate actions (Pro)
- Add automation workflow import and export (Pro)
- Add Contact Information Updated trigger and Update Contact Fields automation action
- Add User Billing Phone merge tag and new invoice/proposal/credit note notification merge tags
- Add credit note triggers and rules to sales automations
- Improve custom field validation and normalization
- Update GDPR messaging and customer notifications in abandoned cart settings
- Improve dashboard redirects and module-aware navigation for user roles
- Add ScrollableMenuList for long dropdown menus across the admin UI

= 1.2.5 = 23 Jun 2026
- Fix sent email text block styling so color, font size, and font family match the email builder preview
- Add phone number field mapping for customer import
- Redesign support inbox with filter dialog, improved bulk actions, and refreshed styling
- Improve booking event cards, date/time picker, and event action dialogs for mobile
- Enhance booking email notifications with safe HTML intros and merge tag support
- Add credit note merge tags and configurable email intro in Sales settings
- Improve booking ShareModal layout and responsiveness for embed and share links
- Update Card, StatusPill, and EmailNotification components for layout consistency
- Fix automation trigger paths for messaging components

= 1.2.4 = 22 Jun 2026
- Fix email builder text block font size so the canvas matches the Font Size field (remove heading multiplier scaling)
- Apply consistent default font sizes when switching text styles (H1, H2, H3, paragraph, small)

= 1.2.3 = 22 Jun 2026
- Fix booking calendar provisioning errors on multisite when the booking tables are not yet created
- Fix email builder text block heading sizes conflicting with the block font size

= 1.2.2 = 11 Jun 2026
- Fix email builder text blocks not appearing in the free version when adding or editing content on the canvas
- Add demo, website, and documentation links at the top of the plugin readme

= 1.2.1 = 19 Jun 2026
- Fix fatal error when updating the free plugin while an older DoubleScale Pro build is still active (legacy booking payment gateway compatibility)
- Show an admin notice when DoubleScale Pro needs updating to 1.1.0 or newer

= 1.2.0 = 19 Jun 2026
- New Sales workspace: proposals, invoices, contracts, credit notes, and subscription billing (Pro)
- Convert proposals to invoices, track payment history, and manage line items with tax settings
- Sales automations: contract triggers, document-ready module checks, and merge tags for proposals and invoices
- Unified attachment management across sales documents and support tickets
- Admin calendar aggregating bookings, sales, and cross-module events in one view
- Customer portal foundation: document access, payment history, subscriptions, and calendar (portal module temporarily disabled while final adjustments ship)
- Improved contact custom fields: validation, required-field handling, and deal custom fields in the pipeline
- Email builder: insert sections in the canvas, richer text block styling and color controls, RichTextEditor placeholders, and footer merge tag extraction
- Support: "View Ticket" button in notification emails and clearer agent attribution on customer ticket views
- Booking: UTC-safe meeting date-time storage and broad layout/responsiveness improvements across calendars and modals
- Meta WhatsApp: clearer account registration error handling
- Settings: improved encryption handling for stored credentials
- Pro feature gates for invoices, payments, and related sales surfaces
- Admin UI: DataTable configuration options, mobile responsiveness, and layout polish across campaigns, automations, booking, support, and sales screens

= 1.1.9 = 15 Jun 2026
- Fix Pro form integrations (Gravity Forms, Elementor, Ninja Forms, etc.) staying locked when DoubleScale Pro is active
- Fix Outlook OAuth scope for consumer Microsoft accounts so IMAP/SMTP connections are not rejected
- Fix email builder text blocks losing content when clicking columns or sections before typing
- Add module storage readiness checks for automation rules (completed/entered automation, lead score level) and sales merge tags so queries are skipped when a module or its database table is not ready
- Add mobile step progress indicator to the SMTP connection wizard
- Improve admin layout and responsiveness across contacts, forms, campaigns, SMTP, support, integrations, license, import/export, and debugging screens
- Refine PageHeader, HeaderBar, DataTableActions, DialogFooter, and dashboard card components for consistent spacing and accessibility
- Update Mailbox settings to use PageTabs for clearer channel management
- Improve Contact Analytics, Email Stats, and Support Reports layouts

= 1.1.8 = 13 Jun 2026
- Fix intermittent fatal error when activating the plugin
- Fix loading splash screen flashing unstyled content on first paint
- Fix contact import list and tag assignment
- Improve WordPress user import first and last name mapping

= 1.1.7 = 12 Jun 2026
- Fix custom fields type dropdown showing no options when adding fields
- Fix email builder font size input clamping while typing
- Prevent text block content loss when selecting columns or sections in the email builder

= 1.1.6 = 12 Jun 2026
- Remove Signature block from the email builder block registry
- Add autosave for text blocks in the email builder

= 1.1.5 = 11 Jun 2026
- Fix email builder font size input only accepting extreme values while typing
- Always show Generate With AI on the campaign templates step

= 1.1.4 = 11 Jun 2026
- Fix campaign setup step subject and preview text not saving after editing and returning to the step
- Rename Support to Helpdesk across modules and admin UI
- Refine Control Modules settings with module cards and clearer grouping
- Update booking Connect button styling to match secondary actions
- Improve template save handling for legacy API subject fields
- Re-enable AI Assistant in the extensions store

= 1.1.3 = 11 Jun 2026
- Auto-install and activate DoubleScale Pro after a valid license is activated
- Show Pro plugin install and active status on the license settings page
- Add Install & Activate and Activate fallback buttons when auto-install does not complete
- Fix license page action buttons that were permanently disabled

= 1.1.2 = 11 Jun 2026
- Add Booking Manager and Booking Agent roles with scoped permissions for dedicated booking staff
- Extend team management UI with booking role assignment and module-aware gating
- Improve user role system to support multiple concurrent roles with merged capabilities
- Scope booking settings access to users with booking management or CRM manager capabilities
- Allow Sales Manager and Sales Rep roles access to the dashboard
- Update brand color system to support white-label CSS variable overrides
- Fix white-label addon plugin file path resolution
- Remove Zapier and AI Assistant addons from store (not yet available)

= 1.1.1 = 10 Jun 2026
- Add Forms module to free plugin with 4 integrations: Contact Form 7, WPForms, Fluent Forms, and Quill Forms
- Add form type selector showing all 15 integrations with Pro badges and install-status hints
- Add horizontal notification preference categories with module icons
- Hide email channel for Booking notifications (uses its own email settings)
- Fix contact field mapping order (contact field on left, form field on right)
- Fix "Manage Custom Fields" button not redirecting to Settings → Custom Fields
- Sort form type cards by active/installed status first
- Update readme with detailed Forms and Automations integration lists

= 1.1.0 = 9 Jun 2026
* New: Support helpdesk module â€” ticket-based customer support with mailbox channels, IMAP email piping, customer portal, and agent inbox
* New: Ticket workflows with priority, status, tags, CC management, and bulk actions (assign, close, merge, tag)
* New: Mailbox management â€” multiple mailbox channels (web and IMAP), default mailbox selection, and ticket movement between mailboxes
* New: File attachments on support tickets with signed secure downloads and configurable size limits
* New: Ticket custom fields and guest access for unauthenticated customers
* New: Support reports dashboard for ticket volume and resolution metrics
* New: Email notifications with threading and subject tagging for ticket replies
* New: Support automation triggers â€” ticket created, ticket status changed â€” connect to the visual automation engine
* New: Dedicated support roles (Support Agent, Support Manager) with scoped permissions
* New: Saved replies and per-ticket activity logging
* New: Automation workflow versioning
* New: Module dependency checks and labels in automation builder
* New: Module status endpoints for mobile app integration
* Improvement: Booking host deduplication for team calendars
* Improvement: Team calendar member validation
* Improvement: IMAP client now counts recent unseen emails
* Improvement: Step insertion logic maintains end_automation order in workflows
* Improvement: Analytics menu and submenu items now visible in free version with Pro upgrade notices
* Improvement: WhatsApp tab visible in contact details with Pro feature notice
* Improvement: Export contacts gated as Pro feature
* Fix: Settings SMTP tab removed (already available as dedicated sidebar item)
* Fix: Mobile App settings tab hidden until feature is available
* Fix: ProtectedRoute and navigation gate respect alwaysRegister flag


= 1.0.2 = 3 Jun 2026
- Fix booking issue
- Fix assets issue
- Fix templates issue while creating a new campaign

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
* 50+ integrations across WooCommerce, EDD, SureCart, LMS plugins (LearnDash, Tutor LMS, LifterLMS, LearnPress), membership plugins (MemberPress, Paid Memberships Pro), 15 form builders, 20+ SMTP providers, Twilio, Meta WhatsApp, Presto Player, Slack, HubSpot, Pipedrive, ActiveCampaign, GoHighLevel, and more

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

Each provider is selectable per connection. DoubleScale sends outgoing mail to that provider's API only after you save credentials.

* **SendGrid** — `https://api.sendgrid.com` · [Terms](https://www.twilio.com/legal/tos) · [Privacy](https://www.twilio.com/legal/privacy)
* **Mailgun** — `https://api.mailgun.net` · [Terms](https://www.mailgun.com/terms) · [Privacy](https://www.mailgun.com/privacy-policy)
* **Postmark** — `https://api.postmarkapp.com` · [Terms](https://postmarkapp.com/terms-of-service) · [Privacy](https://postmarkapp.com/privacy-policy)
* **SparkPost** — `https://api.sparkpost.com` · [Terms](https://www.sparkpost.com/legal/terms-of-use) · [Privacy](https://bird.com/en/legal/privacy)
* **SMTP.com** — `https://api.smtp.com` · [Terms](https://smtp.com/terms-of-service) · [Privacy](https://smtp.com/privacy-policy)
* **SMTP2GO** — `https://api.smtp2go.com` · [Terms](https://www.smtp2go.com/terms/) · [Privacy](https://www.smtp2go.com/privacy/)
* **MailerSend** — `https://api.mailersend.com` · [Terms](https://www.mailersend.com/legal/terms-of-use) · [Privacy](https://www.mailersend.com/legal/privacy-policy)
* **Mailjet** — `https://api.mailjet.com` · [Terms](https://www.mailjet.com/legal/terms) · [Privacy](https://www.mailjet.com/privacy-policy/)
* **Brevo (Sendinblue)** — `https://api.brevo.com` · [Terms](https://www.brevo.com/legal/termsofuse/) · [Privacy](https://www.brevo.com/legal/privacypolicy/)
* **Mandrill** — `https://mandrillapp.com/api` · [Terms](https://mailchimp.com/legal/terms/) · [Privacy](https://mailchimp.com/legal/privacy/)
* **ElasticEmail** — `https://api.elasticemail.com` · [Terms](https://elasticemail.com/resources/usage-policies/terms-of-use/) · [Privacy](https://elasticemail.com/resources/usage-policies/privacy-policy/)
* **SendLayer** — `https://console.sendlayer.com/api` · [Terms](https://sendlayer.com/terms-of-service/) · [Privacy](https://sendlayer.com/privacy-policy/)
* **SocketLabs** — `https://inject.socketlabs.com` · [Terms](https://www.socketlabs.com/terms-of-use) · [Privacy](https://www.socketlabs.com/privacy-policy/)
* **Loops** — `https://app.loops.so/api` · [Terms](https://loops.so/terms) · [Privacy](https://loops.so/privacy)
* **Amazon SES** — AWS regional endpoints (e.g. `https://email.us-east-1.amazonaws.com`) · [Terms](https://aws.amazon.com/service-terms/) · [Privacy](https://aws.amazon.com/privacy/)

= OAuth-based mail providers =

Send mail through your own account via OAuth. Outgoing email content and profile email are sent on connect.

* **Gmail / Google Workspace** — `https://www.googleapis.com/oauth2/*`, `https://gmail.googleapis.com` · [Terms](https://policies.google.com/terms) · [Privacy](https://policies.google.com/privacy)
* **Microsoft Outlook / 365** — `https://login.microsoftonline.com`, `https://graph.microsoft.com` · [Terms](https://www.microsoft.com/legal/terms-of-use) · [Privacy](https://privacy.microsoft.com/privacystatement)
* **Zoho Mail** — `https://accounts.zoho.com`, `https://mail.zoho.com/api` · [Terms](https://www.zoho.com/terms.html) · [Privacy](https://www.zoho.com/privacy.html)

= CRM sync providers (Pro) =

Two-way contact and deal sync. Only mapped fields are sent.

* **ActiveCampaign** — Your account's API host · [Terms](https://www.activecampaign.com/legal/terms-of-service) · [Privacy](https://www.activecampaign.com/legal/privacy-policy)
* **HubSpot** — `https://api.hubapi.com` · [Terms](https://legal.hubspot.com/terms-of-service) · [Privacy](https://legal.hubspot.com/privacy-policy)
* **Pipedrive** — `https://api.pipedrive.com` · [Terms](https://www.pipedrive.com/en/terms-of-service) · [Privacy](https://www.pipedrive.com/en/privacy)
* **GoHighLevel** — `https://marketplace.gohighlevel.com`, `https://services.leadconnectorhq.com` · [Terms](https://www.gohighlevel.com/terms-of-service) · [Privacy](https://www.gohighlevel.com/privacy-policy)

= Messaging providers (Pro) =

* **Twilio** — SMS sending and inbound. Phone numbers and message content sent. `https://api.twilio.com` · [Terms](https://www.twilio.com/legal/tos) · [Privacy](https://www.twilio.com/legal/privacy)
* **Meta WhatsApp Business** — WhatsApp sending and inbound via Cloud API. `https://graph.facebook.com` · [Terms](https://www.whatsapp.com/legal/business-terms) · [Privacy](https://www.whatsapp.com/legal/business-data-transfer-addendum)

= Payments (Pro) =

* **Stripe** — Booking payments (amount, currency, payer email). `https://api.stripe.com` · [Terms](https://stripe.com/legal) · [Privacy](https://stripe.com/privacy)

= Plugin-specific services =

* **DoubleScale (doublescale.io)** — License validation, Pro add-on store, update checks. Sends site URL, environment type, and (on explicit action) license key / add-on ID. No CRM or contact data. `https://doublescale.io` · [Terms](https://doublescale.io/terms) · [Privacy](https://doublescale.io/privacy)
* **UI Avatars (ui-avatars.com)** — Gravatar fallback. The browser loads an initials avatar when no Gravatar exists; only the display name is in the URL. `https://ui-avatars.com/api/` · [Terms](https://ui-avatars.com/terms) · [Privacy](https://ui-avatars.com/privacy)

= AI provider endpoints (optional, bring-your-own-key) =

Point DoubleScale at any OpenAI-compatible endpoint with your own API key. Providers are **not** contacted unless you save credentials.

* **OpenRouter** — `https://openrouter.ai/api/v1` · [Terms](https://openrouter.ai/terms) · [Privacy](https://openrouter.ai/privacy)
* **Groq** — `https://api.groq.com/openai/v1` · [Terms](https://groq.com/terms-of-use) · [Privacy](https://groq.com/privacy-policy)
* Any other OpenAI-compatible endpoint you supply.

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

== Compare ==

See how DoubleScale stacks up against popular CRM and marketing automation tools:

* **DoubleScale vs FluentCRM:** [doublescale.io/compare/vs-fluentcrm](https://doublescale.io/compare/vs-fluentcrm/)
* **DoubleScale vs HubSpot:** [doublescale.io/compare/vs-hubspot](https://doublescale.io/compare/vs-hubspot/)
* **DoubleScale vs ActiveCampaign:** [doublescale.io/compare/vs-activecampaign](https://doublescale.io/compare/vs-activecampaign/)
* **DoubleScale vs Pipedrive:** [doublescale.io/compare/vs-pipedrive](https://doublescale.io/compare/vs-pipedrive/)
* **DoubleScale vs GoHighLevel:** [doublescale.io/compare/vs-gohighlevel](https://doublescale.io/compare/vs-gohighlevel/)
* **DoubleScale vs FunnelKit:** [doublescale.io/compare/vs-funnelkit](https://doublescale.io/compare/vs-funnelkit/)
* **DoubleScale vs Brevo:** [doublescale.io/compare/vs-brevo](https://doublescale.io/compare/vs-brevo/)
* **DoubleScale vs MailerLite:** [doublescale.io/compare/vs-mailerlite](https://doublescale.io/compare/vs-mailerlite/)
* **DoubleScale vs Omnisend:** [doublescale.io/compare/vs-omnisend](https://doublescale.io/compare/vs-omnisend/)

== Integrations ==

Detailed setup guides for connecting DoubleScale with your existing WordPress tools:

**E-commerce & CRM**

* **WooCommerce CRM Integration:** [doublescale.io/integrations/woocommerce](https://doublescale.io/integrations/woocommerce/)
* **LearnDash CRM Integration:** [doublescale.io/integrations/learndash](https://doublescale.io/integrations/learndash/)

