<?php
/**
 * Class Importer
 *
 * This class is responsible for handling the import class
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use QuillCRM\Utils;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\List_Model;
use QuillCRM\Models\Tag_Model;

/**
 * Importer class
 */
abstract class Importer {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name;

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug;

	/**
	 * Is integration
	 *
	 * @var bool
	 */
	protected $is_integration = false;

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
	 * Group
	 *
	 * @var string
	 */
	protected $group;

	/**
	 * Credentials
	 *
	 * @var array
	 */
	public $credentials;

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
		$this->credentials     = $args['credentials'] ?? array();
	}

	/**
	 * Get credentials
	 *
	 * @return array
	 */
	public function get_credentials() {
		return array();
	}

	/**
	 * Set credentials
	 *
	 * @param array $credentials Credentials
	 *
	 * @return void
	 */
	public function set_credentials( $credentials ) {
		$this->credentials = $credentials;
	}

	/**
	 * Get fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return array();
	}

	/**
	 * Is active
	 *
	 * @return bool
	 */
	public function is_active() {
		return true;
	}

	/**
	 * Is integration
	 *
	 * @return bool
	 */
	public function is_integration() {
		return $this->is_integration;
	}

	/**
	 * Import
	 *
	 * @return array
	 */
	public function import() {
		if ( ! $this->is_active() ) {
			return new \WP_Error( 'importer_not_active', __( 'The importer is not active', 'quillcrm' ) );
		}
		$this->start_time = microtime( true );
		return $this->run();
	}

	/**
	 * Run import
	 *
	 * @return array
	 */
	abstract protected function run();

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
						$status          = is_object( $subscriber ) ? $subscriber->status : $subscriber['status'];
						$contact->status = isset( $value[ $status ] ) ? $value[ $status ] : 'unverified';
						continue;
					}

					$contact->$key = is_object( $subscriber ) ? $subscriber->$value : $subscriber[ $value ];
				}

				if ( ! empty( $this->status ) && ! isset( $mapping['status'] ) ) {
					$contact->status = $this->status;
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
	public function import_with_offset( $total, $offset, $get_subscribers_callback, $mapping ) {
		while ( $this->get_current_execution_time() < $this->max_execution_time && ! Utils::is_memory_limit_reached() ) {
			// Usleep is used to prevent the server from crashing
			usleep( 1000000 );

			$subscribers = $get_subscribers_callback( $offset );
			if ( empty( $subscribers ) ) {
				break;
			}

			foreach ( $subscribers as $subscriber ) {
				error_log( 'Importing contact: ' . $offset );
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
