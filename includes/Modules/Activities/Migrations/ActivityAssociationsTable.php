<?php

/**
 * Class ActivityAssociationsTable
 * Unified table for all activity associations (deal, campaign)
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Activities\Migrations;


use DoubleScale\Core\Database\Migration;
/**
 * Activity Associations Table class
 */
class ActivityAssociationsTable extends Migration {


	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'activity_associations';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		/**
		  * Unified Activity Associations Table Fields:
		  *
		  * id: BIGINT(20) NOT NULL AUTO_INCREMENT
		  * activity_id: BIGINT(20) NOT NULL COMMENT "FK to activities table"
		  * entity_type: TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT "1=Deal, 2=Campaign"
		  * entity_id: BIGINT(20) NOT NULL COMMENT "FK to deals, campaigns table"
		  * created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		  * updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		  *
		  * Entity types:
		  * 1 = Deal
		  * 2 = Campaign
		  */
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
            activity_id BIGINT(20) NOT NULL COMMENT "FK to activities table",
            entity_type TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT "1=Deal, 2=Campaign", 
            entity_id BIGINT(20) NOT NULL COMMENT "FK to deals, campaigns table",
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY activity_id (activity_id),
            KEY entity_type (entity_type),
            KEY entity_id (entity_id),
            KEY created_at (created_at),
            KEY updated_at (updated_at),
            KEY composite_activity_entity (activity_id, entity_type, entity_id),
            KEY composite_activity_created (activity_id, created_at),
            KEY composite_activity_updated (activity_id, updated_at)';

		return $query;
	}
}
