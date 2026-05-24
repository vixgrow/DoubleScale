<?php
/**
 * Mailboxes table — email channels / departments.
 *
 * Each row represents a routing destination (e.g. "Sales Support", "Tech Support").
 * `box_type='web'` mailboxes accept tickets via portal/forms; `box_type='email'`
 * mailboxes are polled by `EmailHandler` (IMAP via Action Scheduler) and accept
 * piped email from an MTA. IMAP credentials and per-mailbox config live in the
 * `data` JSON blob.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Support
 */

namespace DoubleScale\Modules\Support\Migrations;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Database\Migration;

/**
 * SupportMailboxesTable migration.
 */
class SupportMailboxesTable extends Migration {

	/**
	 * Logical table name; prefixed in the base constructor.
	 *
	 * @var string
	 */
	public $table_name = 'support_mailboxes';

	/**
	 * `data` stays LONGTEXT rather than JSON for broader MySQL compatibility
	 * through dbDelta — same call-out as Booking's calendar meta. Application
	 * code (MailboxModel data accessor) handles encode/decode.
	 *
	 * @return string
	 */
	public function get_query() {
		return 'id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			slug VARCHAR(191) NOT NULL COMMENT "URL-friendly identifier",
			email VARCHAR(191) NOT NULL COMMENT "Inbound mailbox address",
			box_type VARCHAR(50) NOT NULL DEFAULT "web" COMMENT "web|email",
			is_default TINYINT(1) NOT NULL DEFAULT 0,
			data LONGTEXT NULL COMMENT "JSON: name, avatar, email_footer, imap_provider, imap_host/port/user/pass, imap_folder, sent_folder, sync_sent, excluded_domains",
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY  (id),
			UNIQUE KEY slug (slug),
			UNIQUE KEY email (email),
			KEY idx_box_type (box_type),
			KEY idx_is_default (is_default)';
	}
}
