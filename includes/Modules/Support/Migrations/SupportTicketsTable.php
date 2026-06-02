<?php
/**
 * Tickets table — the support workflow root.
 *
 * The opening message and every subsequent reply / note / system event live in
 * `doublescale_activities` (linked via `activity_associations.entity_type=3`).
 * This row holds workflow state only.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Support
 */

namespace DoubleScale\Modules\Support\Migrations;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Database\Migration;

/**
 * SupportTicketsTable migration.
 */
class SupportTicketsTable extends Migration {

	/**
	 * Logical table name; the base constructor prepends `$wpdb->prefix . 'doublescale_'`.
	 *
	 * @var string
	 */
	public $table_name = 'support_tickets';

	/**
	 * Column definitions for dbDelta (inside the outer parentheses).
	 *
	 * Schema notes:
	 * - `hash`           — 32-char public identifier for portal URLs; UNIQUE.
	 * - `contact_id`     — FK to `doublescale_contacts` (the customer).
	 * - `agent_user_id`  — FK to `wp_users.ID` (the assigned agent). No agent persons table.
	 * - `mailbox_id`     — FK to `doublescale_support_mailboxes`. NULL = direct ticket (no channel).
	 * - `message_id`     — Email Message-ID of the thread root; indexed for inbound matching.
	 * - `content_hash`   — MD5 of the opening message body; used for inbound dedupe.
	 * - `response_count` — Denormalized counter maintained by ActivityModel::created event.
	 * - `tag_ids`        — JSON array of `doublescale_tags.id`. Filtered via JSON_CONTAINS.
	 * - `custom_data`    — JSON map of per-ticket custom-field values
	 *                      (field definitions live in `doublescale_settings['support']['custom_fields']`).
	 *
	 * @return string
	 */
	public function get_query() {
		// NOTE: No inline column COMMENT clauses. dbDelta() splits the column
		// list on commas to parse each field; a COMMENT whose text contains a
		// comma or semicolon (e.g. 'open|pending', 'Denormalized counter; ...')
		// corrupts that tokenizer and the CREATE TABLE fails — yet dbDelta still
		// reports "Created table", so MigrationRunner records the migration as
		// done while the table never exists. Column semantics are documented in
		// the class docblock above instead. See git history for the original bug.
		return "id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			hash VARCHAR(32) NOT NULL,
			title VARCHAR(255) NOT NULL,
			status VARCHAR(50) NOT NULL DEFAULT 'open' COMMENT 'open|pending|resolved|closed',
			priority VARCHAR(20) NOT NULL DEFAULT 'normal' COMMENT 'low|normal|high|urgent',
			mailbox_id BIGINT(20) UNSIGNED NULL COMMENT 'FK to doublescale_support_mailboxes',
			contact_id BIGINT(20) UNSIGNED NOT NULL COMMENT 'FK to doublescale_contacts (customer)',
			agent_user_id BIGINT(20) UNSIGNED NULL COMMENT 'FK to wp_users.ID (assigned agent)',
			product VARCHAR(100) NULL COMMENT 'Free-text product label',
			message_id VARCHAR(191) NULL COMMENT 'Email Message-ID of the thread root',
			content_hash VARCHAR(32) NULL COMMENT 'MD5 of opening message body for inbound dedupe',
			response_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Denormalized counter, incremented by TicketService::add_reply',
			tag_ids JSON NULL COMMENT 'Array of doublescale_tags.id',
			custom_data JSON NULL COMMENT 'Per-ticket custom field values',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY  (id),
			UNIQUE KEY hash (hash),
			KEY idx_contact_status (contact_id, status),
			KEY idx_agent_status (agent_user_id, status),
			KEY idx_mailbox_status (mailbox_id, status, created_at),
			KEY idx_message_id (message_id),
			KEY idx_created (created_at)";
	}
}
