<?php
/**
 * Class Communication_Tracking_Meta_Table
 * Meta table for communication tracking using WordPress meta_key/meta_value convention
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Communication_Tracking_Meta_Table class
 */
class Communication_Tracking_Meta_Table extends Migration {


	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'communication_tracking_meta';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		/**
		  * Communication Tracking Meta Table Fields (WordPress Convention):
		  *
		  * meta_id: BIGINT(20) NOT NULL AUTO_INCREMENT
		  * communication_tracking_id: BIGINT(20) NOT NULL
		  * meta_key: VARCHAR(255) - Key for the meta data (e.g., 'merge_tags', 'sections_ids')
		  * meta_value: LONGTEXT - Value for the meta data (JSON format)
		  * created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		  * updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		  */
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
            communication_tracking_id BIGINT(20) NOT NULL,
            meta_key VARCHAR(255),
            meta_value LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY communication_tracking_id (communication_tracking_id),
            KEY meta_key (meta_key(191))';
		return $query;
	}
}
