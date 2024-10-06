<?php
/**
 * Class Import
 *
 * This class is responsible for handling the Import
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Import_Export;

use QuillCRM\Utils;
use QuillCRM\Models\Contact_Model;

/**
 * Import class
 */
class Import {

	/**
	 * Start time
	 *
	 * @var int
	 */
	protected $start_time;

	/**
	 * Max execution time
	 *
	 * @var int
	 */
	protected $max_execution_time;

	/**
	 * Current execution time
	 *
	 * @var int
	 */
	protected $current_execution_time;

	/**
	 * Constructor
	 */
	public function __construct() {
		// Get the max execution time
		$this->max_execution_time = Utils::get_max_execution_time();
	}

	/**
	 * Import from fluentCRM
	 *
	 * @since 1.0.0
	 *
	 * @param int $offset Offset
	 * @param int $limit Limit
	 *
	 * @return array
	 */
	public function import_from_fluentcrm( $offset = 0, $limit = 20 ) {
		global $wpdb;

		$this->start_time = microtime( true );
		$table_name       = $wpdb->prefix . 'fc_subscribers';
		$total            = $wpdb->get_var( "SELECT COUNT(*) FROM $table_name" );

		while ( $this->get_current_execution_time() < $this->max_execution_time && ! Utils::is_memory_limit_reached() ) {
			// Usleep is used to prevent the server from crashing
			usleep( 1000000 );

			$subscribers = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $table_name LIMIT %d, %d", $offset, $limit ) );
			if ( empty( $subscribers ) ) {
				break;
			}

			foreach ( $subscribers as $subscriber ) {
				$this->import_contact( $subscriber );
				$offset++;
			}

			// Check if offset is greater than or equal to total
			if ( $offset >= $total ) {
				break;
			}
		}

		$status = $offset >= $total ? 'completed' : 'in_progress';
		return array(
			'offset' => $offset,
			'status' => $status,
			'total'  => $total,
		);
	}

	/**
	 * Import contact
	 *
	 * @since 1.0.0
	 *
	 * @param object $subscriber Subscriber
	 *
	 * @return bool
	 */
	public function import_contact( $subscriber ) {
		try {
			// Check if the contact already exists
			$contact = Contact_Model::where( 'email', $subscriber->email )->first();
			if ( $contact ) {
				return;
			}

			$contact             = new Contact_Model();
			$contact->first_name = $subscriber->first_name;
			$contact->last_name  = $subscriber->last_name;
			$contact->email      = $subscriber->email;
			$contact->phone      = $subscriber->phone;
			$contact->address_1  = $subscriber->address_line_1;
			$contact->address_2  = $subscriber->address_line_2;
			$contact->city       = $subscriber->city;
			$contact->state      = $subscriber->state;
			$contact->zip        = $subscriber->postal_code;
			$contact->country    = $subscriber->country;
			$contact->save();
		} catch ( \Exception $e ) {
			return new \WP_Error( 'import_failed', $e->getMessage() );
		}
	}

	/**
	 * Get current execution time
	 *
	 * @return int
	 */
	public function get_current_execution_time() {
		return microtime( true ) - $this->start_time;
	}
}
