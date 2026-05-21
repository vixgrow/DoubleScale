<?php
/**
 * WcCustomers Importer
 *
 * This class is responsible for handling the WcCustomers importer
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Contacts\ImportExport\Importers;

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- transactional CRM/scheduler/campaign DB ops; persistent caching is impractical for write-heavy or per-request lookups (matches WooCommerce/FluentCRM precedent).


defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Contacts\Abstracts\Importer;
use DoubleScale\Core\Models\UserModel;

/**
 * WcCustomers Importer class
 */
class WcCustomers extends Importer {

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
		return doublescale_is_plugin_active( 'woocommerce/woocommerce.php' );
	}

	/**
	 * Run importer
	 */
	public function run() {
		global $wpdb;

		// phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name is from WooCommerce plugin.

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
			function ( $offset ) use ( $wpdb, $table_name ) {
				return $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $table_name LIMIT %d, 20", $offset ) );
			},
			$mapping
		);

		// phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		return $result;
	}
}
