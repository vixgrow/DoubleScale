<?php
/**
 * File attachments on contracts.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Migrations;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Database\Migration;

/**
 * SalesContractAttachmentsTable migration.
 */
class SalesContractAttachmentsTable extends Migration {

	/**
	 * @var string
	 */
	public $table_name = 'sales_contract_attachments';

	/**
	 * @return string
	 */
	public function get_query() {
		return "id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			contract_id BIGINT(20) UNSIGNED NOT NULL,
			user_id BIGINT(20) UNSIGNED NULL,
			contact_id BIGINT(20) UNSIGNED NULL,
			file_name VARCHAR(255) NOT NULL,
			file_path VARCHAR(500) NOT NULL,
			file_type VARCHAR(100) NOT NULL DEFAULT '',
			file_size BIGINT(20) UNSIGNED NOT NULL DEFAULT 0,
			file_hash VARCHAR(64) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY  (id),
			UNIQUE KEY file_hash (file_hash),
			KEY idx_contract (contract_id)";
	}
}
