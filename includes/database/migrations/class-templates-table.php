<?php
/**
 * Class Templates_Table
 * This class is responsible for handling the template table migration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

/**
 * Templates_Table class
 */
class Templates_Table extends Migration {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $table_name = 'templates';

	/**
	 * Get query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		/**
		 * Fields:
		 *
		 * id BIGINT(20) NOT NULL AUTO_INCREMENT,
		 * name VARCHAR(255) NOT NULL,
		 * type TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=Email, 2=SMS, 3=WhatsApp',
		 * subject VARCHAR(255) NOT NULL,
		 * body TEXT,
		 * settings TEXT,
		 * hidden TINYINT(1) NOT NULL DEFAULT 1,
		 * preview_text TEXT,
		 * thumbnail VARCHAR(255),
		 * category VARCHAR(100) DEFAULT 'general',
		 * is_pro TINYINT(1) NOT NULL DEFAULT 0,
		 * created_by BIGINT(20),
		 * content_hash VARCHAR(64) NULL COMMENT 'SHA-256 hash for auto-template deduplication',
		 * is_auto_generated TINYINT(1) DEFAULT 0 COMMENT 'Flag for auto-generated templates',
		 * created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		 * updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		 */
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            type TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT "1=Email, 2=SMS, 3=WhatsApp",
            subject VARCHAR(255) NOT NULL,
            body LONGTEXT,
            settings LONGTEXT,
            hidden TINYINT(1) NOT NULL DEFAULT 1,
            preview_text TEXT,
            thumbnail VARCHAR(255),
            category VARCHAR(100) DEFAULT "general",
            is_pro TINYINT(1) NOT NULL DEFAULT 0,
            created_by BIGINT(20),
            content_hash VARCHAR(64) NULL COMMENT "SHA-256 hash for auto-template deduplication",
            is_auto_generated TINYINT(1) DEFAULT 0 COMMENT "Flag for auto-generated templates",
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_type (type),
            UNIQUE INDEX idx_content_hash_auto (content_hash, is_auto_generated)';

		return $query;
	}

}
