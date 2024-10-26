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
use QuillCRM\Models\User_Model;
use League\Csv\Reader;
use League\Csv\Statement;

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
	 * Import
	 *
	 * @since 1.0.0
	 *
	 * @param string $source Source
	 * @param int    $offset Offset
	 *
	 * @return array
	 */
	public function import( $source, $offset = 0 ) {
		switch ( $source ) {
			case 'fluentcrm':
				return $this->import_from_fluentcrm( $offset );
			case 'wpfunnelkit':
				return $this->import_from_wpfunnels( $offset );
			case 'wc':
				return $this->import_from_woocommerce( $offset );
			case 'wpusers':
				return $this->import_from_wordpress_users( $offset );
		}
	}

	/**
	 * Get fluentCRM lists and tags
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fluentcrm_lists_and_tags() {
		global $wpdb;
		$lists_table = $wpdb->prefix . 'fc_lists';
		$tags_table  = $wpdb->prefix . 'fc_tags';

		$lists = $wpdb->get_results( "SELECT * FROM $lists_table" );
		$tags  = $wpdb->get_results( "SELECT * FROM $tags_table" );

		$lists_array = array();
		foreach ( $lists ?? array() as $list ) {
			$lists_array[] = array(
				'value' => $list->id,
				'label' => $list->title,
			);
		}

		$tags_array = array();
		foreach ( $tags ?? array() as $tag ) {
			$tags_array[] = array(
				'value' => $tag->id,
				'label' => $tag->title,
			);
		}

		return array(
			'lists' => $lists_array,
			'tags'  => $tags_array,
		);
	}

	/**
	 * Get WPFunnels lists and tags
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_wpfunnels_lists_and_tags() {
		global $wpdb;
		$terms_table = $wpdb->prefix . 'bwfan_terms';

		$terms = $wpdb->get_results( "SELECT * FROM $terms_table" );

		$lists_array = array();
		$tags_array  = array();

		foreach ( $terms ?? array() as $term ) {
			if ( ! isset( $term->type ) || ! in_array( $term->type, array( 1, 2 ) ) ) {
				continue;
			}

			if ( 1 === $term->type ) {
				$tags_array[] = array(
					'value' => $term->ID,
					'label' => $term->name,
				);

				continue;
			}

			$lists_array[] = array(
				'value' => $term->ID,
				'label' => $term->name,
			);
		}

		return array(
			'lists' => $lists_array,
			'tags'  => $tags_array,
		);
	}

	/**
	 * Import from fluentCRM
	 *
	 * @since 1.0.0
	 *
	 * @param int $offset Offset
	 *
	 * @return array
	 */
	public function import_from_fluentcrm( $offset = 0 ) {
		global $wpdb;

		$this->start_time = microtime( true );
		$table_name       = $wpdb->prefix . 'fc_subscribers';
		$total            = $wpdb->get_var( "SELECT COUNT(*) FROM $table_name" );
		$mapping          = array(
			'first_name' => 'first_name',
			'last_name'  => 'last_name',
			'email'      => 'email',
			'phone'      => 'phone',
			'address_1'  => 'address_line_1',
			'address_2'  => 'address_line_2',
			'city'       => 'city',
			'state'      => 'state',
			'zip'        => 'postal_code',
			'country'    => 'country',
		);

		$result = $this->import_with_offset(
			$total,
			$offset,
			function( $offset ) use ( $wpdb, $table_name ) {
				return $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $table_name LIMIT %d, 20", $offset ) );
			},
			$mapping
		);

		return $result;
	}

	/**
	 * Import from WPFunnels
	 *
	 * @since 1.0.0
	 *
	 * @param int $offset Offset
	 *
	 * @return array
	 */
	public function import_from_wpfunnels( $offset = 0 ) {
		global $wpdb;

		$this->start_time = microtime( true );
		$table_name       = $wpdb->prefix . 'bwf_contact';
		$total            = $wpdb->get_var( "SELECT COUNT(*) FROM $table_name" );
		$mapping          = array(
			'first_name' => 'f_name',
			'last_name'  => 'l_name',
			'email'      => 'email',
			'state'      => 'state',
			'country'    => 'country',
		);

		$result = $this->import_with_offset(
			$total,
			$offset,
			function( $offset ) use ( $wpdb, $table_name ) {
				return $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $table_name LIMIT %d, 20", $offset ) );
			},
			$mapping
		);

		return $result;
	}

	/**
	 * Import from WooCommerce
	 *
	 * @since 1.0.0
	 *
	 * @param int $offset Offset
	 *
	 * @return array
	 */
	public function import_from_woocommerce( $offset = 0 ) {
		global $wpdb;

		$this->start_time = microtime( true );
		$table_name       = $wpdb->prefix . 'wc_customer_lookup';
		$total            = $wpdb->get_var( "SELECT COUNT(*) FROM $table_name" );
		$mapping          = array(
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
			$offset,
			function( $offset ) use ( $wpdb, $table_name ) {
				return $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $table_name LIMIT %d, 20", $offset ) );
			},
			$mapping
		);

		return $result;
	}

	/**
	 * Import WordPress users
	 *
	 * @since 1.0.0
	 *
	 * @param int $offset Offset
	 *
	 * @return array
	 */
	public function import_from_wordpress_users( $offset = 0 ) {

		$this->start_time = microtime( true );
		$total            = User_Model::count();

		$mapping = array(
			'email' => 'user_email',
		);

		$result = $this->import_with_offset(
			$total,
			$offset,
			function( $offset ) {
				return User_Model::offset( $offset )->limit( 20 )->get();
			},
			$mapping
		);

		return $result;
	}

	/**
	 * Import from csv
	 *
	 * @since 1.0.0
	 *
	 * @param array $file_name File name
	 * @param array $mapping Mapping
	 * @param int   $offset Offset
	 *
	 * @return array
	 */
	public function import_from_csv( $file_name, $mapping, $offset = 0 ) {
		$this->start_time = microtime( true );
		$mapping          = array_flip( $mapping );
		$file_path        = wp_upload_dir()['basedir'] . '/QuillCRM/Import-Export/' . $file_name;
		$csv              = Reader::createFromPath( $file_path, 'r' );
		$csv->setHeaderOffset( 0 );
		$total = count( $csv );

		$result = $this->import_with_offset(
			$total,
			$offset,
			function( $offset ) use ( $csv ) {
				$stmt        = ( new Statement() )->offset( $offset )->limit( 20 );
				$subscribers = $stmt->process( $csv );
				return $subscribers;
			},
			$mapping
		);

		if ( 'completed' === $result['status'] ) {
			unlink( $file_path );
		}

		return $result;
	}

	/**
	 * Import contact
	 *
	 * @since 1.0.0
	 *
	 * @param object $subscriber Subscriber
	 * @param array  $mapping Mapping
	 *
	 * @return bool
	 */
	public function import_contact( $subscriber, $mapping ) {
		try {
			// Check if the contact already exists
			$email   = is_object( $subscriber ) ? $subscriber->{$mapping['email']} : $subscriber[ $mapping['email'] ];
			$contact = Contact_Model::where( 'email', $email )->first();
			if ( $contact ) {
				return;
			}

			$contact = new Contact_Model();
			foreach ( $mapping as $key => $value ) {
				$contact->$key = is_object( $subscriber ) ? $subscriber->$value : $subscriber[ $value ];
			}
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

	/**
	 * Import with offset
	 *
	 * @param int      $total
	 * @param int      $offset
	 * @param callable $get_subscribers_callback
	 * @param array    $mapping
	 * @return array
	 */
	private function import_with_offset( $total, $offset, $get_subscribers_callback, $mapping ) {
		while ( $this->get_current_execution_time() < $this->max_execution_time && ! Utils::is_memory_limit_reached() ) {
			// Usleep is used to prevent the server from crashing
			usleep( 1000000 );

			$subscribers = $get_subscribers_callback( $offset );
			if ( empty( $subscribers ) ) {
				break;
			}

			foreach ( $subscribers as $subscriber ) {
				$this->import_contact( $subscriber, $mapping );
				$offset++;
			}

			// Check if offset is greater than or equal to total
			if ( $offset >= $total ) {
				break;
			}
		}

		$result = array(
			'offset' => $offset,
			'status' => $offset >= $total ? 'completed' : 'in_progress',
			'total'  => $total,
		);

		return $result;
	}
}
