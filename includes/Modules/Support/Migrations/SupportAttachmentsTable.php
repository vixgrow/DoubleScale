<?php
/**
 * Attachments table — private file storage for ticket conversations.
 *
 * Files live under `uploads/doublescale-support/` (NOT the WordPress Media
 * Library) so they are not browsable by other admins. Downloads go through
 * signed URLs (`?ds_support_file={file_hash}&ds_support_sign={hmac}`).
 *
 * Two-phase upload flow:
 *   1. POST attachment → row created with ticket_id set, activity_id=NULL, status='temp'.
 *   2. Reply created   → matching temp rows get activity_id set, status='active'.
 *   3. Daily cron      → deletes temp rows older than 24h that never linked.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Support
 */

namespace DoubleScale\Modules\Support\Migrations;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Database\Migration;

/**
 * SupportAttachmentsTable migration.
 */
class SupportAttachmentsTable extends Migration {

	/**
	 * Logical table name; prefixed in the base constructor.
	 *
	 * @var string
	 */
	public $table_name = 'support_attachments';

	/**
	 * Schema notes:
	 * - `ticket_id`   — set immediately on upload (before the reply activity exists).
	 * - `activity_id` — FK to `doublescale_activities`; NULL during temp phase.
	 * - `user_id` vs `contact_id` — exactly one is populated per row depending on uploader.
	 * - `file_hash`   — UNIQUE; used to look up the file from a signed download URL.
	 * - `driver`      — 'local' today; allows S3/Drive later without a schema bump.
	 * - `status`      — 'temp' until the parent activity is created, then 'active'.
	 *
	 * @return string
	 */
	public function get_query() {
		return "id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			ticket_id BIGINT(20) UNSIGNED NULL COMMENT 'FK to doublescale_support_tickets',
			activity_id BIGINT(20) UNSIGNED NULL COMMENT 'FK to doublescale_activities, NULL during temp phase',
			user_id BIGINT(20) UNSIGNED NULL COMMENT 'Uploader WP user (agents)',
			contact_id BIGINT(20) UNSIGNED NULL COMMENT 'Uploader contact (customer via portal)',
			file_name VARCHAR(255) NOT NULL COMMENT 'Original filename as uploaded',
			file_path VARCHAR(500) NOT NULL COMMENT 'Relative path under uploads/doublescale-support/',
			file_type VARCHAR(100) NOT NULL COMMENT 'MIME type',
			file_size BIGINT(20) UNSIGNED NOT NULL DEFAULT 0,
			file_hash VARCHAR(64) NOT NULL COMMENT 'Random hash for signed download URLs',
			content_id VARCHAR(255) NULL COMMENT 'MIME Content-ID for inline email images, brackets stripped',
			driver VARCHAR(50) NOT NULL DEFAULT 'local',
			status VARCHAR(20) NOT NULL DEFAULT 'temp' COMMENT 'active|temp',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY  (id),
			UNIQUE KEY idx_file_hash (file_hash),
			KEY idx_ticket (ticket_id),
			KEY idx_activity (activity_id),
			KEY idx_user (user_id),
			KEY idx_contact (contact_id),
			KEY idx_status (status)";
	}
}
