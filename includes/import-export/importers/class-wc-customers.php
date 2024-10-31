<?php
/**
 * WC_Customers Importer
 *
 * This class is responsible for handling the WC_Customers importer
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Import_Export\Importers;

use QuillCRM\Abstracts\Importer;
use QuillCRM\Models\User_Model;

/**
 * WC_Customers Importer class
 */
class WC_Customers extends Importer {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'WooCommerce Customers';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_customers';

	/**
	 * Is Integration
	 *
	 * @var bool
	 */
	protected $is_integration = false;

	/**
	 * Is Active
	 *
	 * @var bool
	 */
	public function is_active() {
		return quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' );
	}

	/**
	 * Run importer
	 */
	public function run() {
		global $wpdb;

		$table_name = $wpdb->prefix . 'wc_customer_lookup';
		$total      = $wpdb->get_var( "SELECT COUNT(*) FROM $table_name" );
		$mapping    = array(
			'first_name' => 'first_name',
			'last_name'  => 'last_name',
			'email'      => 'email',
			'city'       => 'city',
			'state'      => 'state',
			'zip'        => 'postcode',
			'country'    => 'country',
		);

		$result = $this->import_with_offset(
			$total,
			$this->offset,
			function( $offset ) use ( $wpdb, $table_name ) {
				return $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $table_name LIMIT %d, 20", $offset ) );
			},
			$mapping
		);

		return $result;
	}
}
