<?php

/**
 * Class Form_Submissions_Table
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Database\Migrations;

use QuillCRM\Database\Migrations\Migration;

/**
 * Form_Submissions_Table class
 */
class Form_Submissions_Table extends Migration {


	/**
	 * Table Name
	 *
	 * @var string
	 */
	public $table_name = 'form_submissions';

	/**
	 * Get Query
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function get_query() {
		/**
		  * Fields:
		  *
		  * id: Primary key
		  * form_id: ID of the form from forms table
		  * contact_id: ID of the contact who submitted the form
		  * external_entry_id: External entry ID
		  * created_at: Created at timestamp
		  * updated_at: Updated at timestamp
		  */
		$query = 'id BIGINT(20) NOT NULL AUTO_INCREMENT,
            form_id BIGINT(20),
            contact_id BIGINT(20),
			external_entry_id VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)';

		return $query;
	}
}
