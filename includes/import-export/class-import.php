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
use QuillCRM\Models\Tag_Model;
use QuillCRM\Models\List_Model;

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
	 * Lists mapping
	 *
	 * @var array
	 */
	protected $lists_mapping;

	/**
	 * Tags mapping
	 *
	 * @var array
	 */
	protected $tags_mapping;

	/**
	 * Lists
	 *
	 * @var array
	 */
	protected $lists;

	/**
	 * Tags
	 *
	 * @var array
	 */
	protected $tags;

	/**
	 * Offset
	 *
	 * @var int
	 */
	protected $offset;

	/**
	 * Update existing
	 *
	 * @var bool
	 */
	protected $update_existing;

	/**
	 * Status
	 *
	 * @var string
	 */
	protected $status;

	/**
	 * Constructor
	 *
	 * @param array $args args
	 */
	public function __construct( $args = array() ) {
		// Get the max execution time
		$this->max_execution_time = Utils::get_max_execution_time();

		// Set the args
		$this->update_existing = $args['update_existing'] ?? false;
		$this->status          = $args['status'] ?? 'unverified';
		$this->lists_mapping   = $args['lists_mapping'] ?? array();
		$this->tags_mapping    = $args['tags_mapping'] ?? array();
		$this->offset          = $args['offset'] ?? 0;
		$this->lists           = $args['lists'] ?? array();
		$this->tags            = $args['tags'] ?? array();
	}

	/**
	 * Import
	 *
	 * @since 1.0.0
	 *
	 * @param string $source Source
	 *
	 * @return array
	 */
	public function import( $source ) {
		switch ( $source ) {
			case 'fluentcrm':
				return $this->import_from_fluentcrm();
			case 'wpfunnelkit':
				return $this->import_from_wpfunnels();
			case 'wc':
				return $this->import_from_woocommerce();
			case 'wpusers':
				return $this->import_from_wordpress_users();
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
			$lists_array[] = $list->title;
		}

		$tags_array = array();
		foreach ( $tags ?? array() as $tag ) {
			$tags_array[] = $tag->title;
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

			if ( 1 == $term->type ) {
				$tags_array[] = $term->name;
				continue;
			}

			$lists_array[] = $term->name;
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
	 * @return array
	 */
	public function import_from_fluentcrm() {
		global $wpdb;

		$this->start_time = microtime( true );

		$table_name  = $wpdb->prefix . 'fc_subscribers';
		$pivot_table = $wpdb->prefix . 'fc_subscriber_pivot';
		$list_table  = $wpdb->prefix . 'fc_lists';
		$tag_table   = $wpdb->prefix . 'fc_tags';

		// Define the mapping as before
		$mapping = array(
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
			'status'     => array(
				'unsubscribed' => 'unsubscribed',
				'subscribed'   => 'subscribed',
				'pending'      => 'unverified',
			),
		);

		// Get total subscribers count
		$total = $wpdb->get_var( "SELECT COUNT(*) FROM $table_name" );

		$result = $this->import_with_offset(
			$total,
			$this->offset,
			function ( $offset ) use ( $wpdb, $table_name, $pivot_table, $list_table, $tag_table ) {
				return $wpdb->get_results(
					$wpdb->prepare(
						"SELECT s.*, 
								GROUP_CONCAT(DISTINCT CASE WHEN p.object_type LIKE '%List%' THEN l.title END) AS lists,
								GROUP_CONCAT(DISTINCT CASE WHEN p.object_type LIKE '%Tag%' THEN t.title END) AS tags
						 FROM $table_name AS s
						 
						 LEFT JOIN $pivot_table AS p ON s.id = p.subscriber_id
						 LEFT JOIN $list_table AS l ON p.object_id = l.id AND p.object_type LIKE '%List%'
						 LEFT JOIN $tag_table AS t ON p.object_id = t.id AND p.object_type LIKE '%Tag%'
						 
						 GROUP BY s.id
						 LIMIT %d, 20",
						$offset
					),
					ARRAY_A
				);
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
	 * @return array
	 */
	public function import_from_wpfunnels() {
		global $wpdb;

		$this->start_time = microtime( true );
		$table_name       = $wpdb->prefix . 'bwf_contact';
		$terms_table      = $wpdb->prefix . 'bwfan_terms';
		$total            = $wpdb->get_var( "SELECT COUNT(*) FROM $table_name" );
		$mapping          = array(
			'first_name' => 'f_name',
			'last_name'  => 'l_name',
			'email'      => 'email',
			'state'      => 'state',
			'country'    => 'country',
			'status'     => array(
				'0' => 'unverified',
				'1' => 'subscribed',
				'2' => 'unsubscribed',
			),
		);

		$result = $this->import_with_offset(
			$total,
			$this->offset,
			function( $offset ) use ( $wpdb, $table_name, $terms_table ) {
				return $wpdb->get_results(
					$wpdb->prepare(
						"SELECT c.*, 
								GROUP_CONCAT(DISTINCT CASE WHEN t.type = 2 THEN t.name END) AS lists,
								GROUP_CONCAT(DISTINCT CASE WHEN t.type = 1 THEN t.name END) AS tags
						 FROM $table_name AS c
						 
						 LEFT JOIN $terms_table AS t 
							ON JSON_CONTAINS(c.lists, JSON_QUOTE(CAST(t.id AS CHAR))) OR JSON_CONTAINS(c.tags, JSON_QUOTE(CAST(t.id AS CHAR)))
		
						 GROUP BY c.id
						 LIMIT %d, 20",
						$offset
					),
					ARRAY_A
				);
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
	 * @return array
	 */
	public function import_from_woocommerce() {
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
			$this->offset,
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
	 * @return array
	 */
	public function import_from_wordpress_users() {

		$this->start_time = microtime( true );
		$total            = User_Model::count();

		$mapping = array(
			'email' => 'user_email',
		);

		$result = $this->import_with_offset(
			$total,
			$this->offset,
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
	 *
	 * @return array
	 */
	public function import_from_csv( $file_name, $mapping ) {
		$this->start_time = microtime( true );
		$mapping          = array_flip( $mapping );
		$file_path        = wp_upload_dir()['basedir'] . '/QuillCRM/Import-Export/' . $file_name;
		$csv              = Reader::createFromPath( $file_path, 'r' );
		$csv->setHeaderOffset( 0 );
		$total = count( $csv );

		$result = $this->import_with_offset(
			$total,
			$this->offset,
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
			$email = is_object( $subscriber ) ? $subscriber->{$mapping['email']} : $subscriber[ $mapping['email'] ];
			$lists = is_object( $subscriber ) ? $subscriber->lists ?? array() : $subscriber['lists'] ?? array();
			$lists = $lists ? explode( ',', $lists ) : array();
			$tags  = is_object( $subscriber ) ? $subscriber->tags ?? array() : $subscriber['tags'] ?? array();
			$tags  = $tags ? explode( ',', $tags ) : array();

			$contact  = Contact_Model::where( 'email', $email )->first();
			$existing = $contact ? true : false;
			if ( ! $contact ) {
				$contact = new Contact_Model();
			}

			if ( ( $this->update_existing && $existing ) || ! $existing ) {
				foreach ( $mapping as $key => $value ) {
					if ( 'status' === $key ) {
						$status                = is_object( $subscriber ) ? $subscriber->status : $subscriber['status'];
						$contact->email_status = isset( $value[ $status ] ) ? $value[ $status ] : 'unverified';
						continue;
					}

					$contact->$key = is_object( $subscriber ) ? $subscriber->$value : $subscriber[ $value ];
				}

				if ( ! empty( $this->status ) && ! isset( $mapping['status'] ) ) {
					$contact->email_status = $this->status;
				}

				$contact->save();

				// Add the contact to the lists
				foreach ( $this->lists_mapping as $list ) {
					$name        = $list['list'];
					$assign_to   = $list['assignedList'] ?? array();
					$auto_create = $list['auto'] ?? false;

					if ( ! in_array( $name, $lists ) ) {
						continue;
					}

					if ( $auto_create ) {
						$list = List_Model::getOrCreate( $name );
						$contact->lists()->sync( $list->id, false );
					} else {
						if ( ! empty( $assign_to ) ) {
							$contact->lists()->sync( $assign_to, false );
						}
					}
				}

				// Add the contact to the tags
				foreach ( $this->tags_mapping as $tag ) {
					$name        = $tag['tag'];
					$assign_to   = $tag['assignedTag'] ?? array();
					$auto_create = $tag['auto'] ?? false;

					if ( ! in_array( $name, $tags ) ) {
						continue;
					}

					if ( $auto_create ) {
						$tag = Tag_Model::getOrCreate( $name );
						$contact->tags()->sync( $tag->id, false );
					} else {
						if ( ! empty( $assign_to ) ) {
							$contact->tags()->sync( $assign_to, false );
						}
					}
				}

				if ( ! empty( $this->tags ) ) {
					$contact->tags()->sync( $this->tags, false );
				}

				if ( ! empty( $this->lists ) ) {
					$contact->lists()->sync( $this->lists, false );
				}
			}

			return true;
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
		$imported_count = 0;
		$error_count    = 0;

		while ( $this->get_current_execution_time() < $this->max_execution_time && ! Utils::is_memory_limit_reached() ) {
			// Usleep is used to prevent the server from crashing
			usleep( 1000000 );

			$subscribers = $get_subscribers_callback( $offset );
			if ( empty( $subscribers ) ) {
				break;
			}

			foreach ( $subscribers as $subscriber ) {
				$import_result = $this->import_contact( $subscriber, $mapping );
				if ( is_wp_error( $import_result ) ) {
					$error_count++;
				} else {
					$imported_count++;
				}
				$offset++;
			}

			// Check if offset is greater than or equal to total
			if ( $offset >= $total ) {
				break;
			}
		}

		$is_completed = $offset >= $total;

		$result = array(
			'offset' => $offset,
			'status' => $is_completed ? 'completed' : 'in_progress',
			'total'  => $total,
		);

		// Fire action when import is completed.
		if ( $is_completed ) {
			/**
			 * Fires when a contact import is completed.
			 *
			 * @since 1.2.0
			 *
			 * @param int $user_id        The user who initiated the import.
			 * @param int $imported_count Number of contacts successfully imported.
			 * @param int $error_count    Number of errors during import.
			 * @param int $total          Total contacts processed.
			 */
			do_action( 'quillcrm_import_completed', get_current_user_id(), $imported_count, $error_count, $total );
		}

		return $result;
	}
}
