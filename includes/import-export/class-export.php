<?php

/**
 * Class Export
 *
 * This class is responsible for handling the export class
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Import_Export;

use QuillCRM\Utils;
use QuillCRM_Pro\Fields\Contact_Fields;
use QuillCRM\Models\Contact_Model;
use League\Csv\Writer;
use QuillCRM\Contact_Filters\Process as Contact_Filters_Process;
use QuillCRM\Import_Export\Security;
use WP_Error;

/**
 * Export class
 */
class Export {


	/**
	 * File id
	 *
	 * @var string
	 */
	protected $file_id;

	/**
	 * Offset
	 *
	 * @var int
	 */
	protected $offset;

	/**
	 * Fields
	 *
	 * @var array
	 */
	protected $fields;

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
	 * Filters
	 *
	 * @var array
	 */
	protected $filters;

	/**
	 * Constructor
	 *
	 * @param array $args
	 *
	 * @since 1.0.0
	 */
	public function __construct( $args ) {
		$this->max_execution_time = Utils::get_max_execution_time();
		$this->file_id            = $args['file_id'];
		$this->offset             = $args['offset'];
		$this->fields             = $args['fields'] ?? array(
			'first_name',
			'last_name',
			'email',
		);
		$this->filters            = $args['filters'] ?? array();
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
	 * Export
	 */
	public function export() {
		$this->start_time = microtime( true );
		if ( ! Security::prepare_upload_dir() ) {
			return new WP_Error( 'filesystem_error', 'Failed to create upload directory', array( 'status' => 500 ) );
		}

		$file_path            = wp_upload_dir()['basedir'] . '/QuillCRM/Import-Export/quillcrm-export-' . $this->file_id . '.csv';
		$total_contacts_query = Contact_Model::query();

		if ( ! empty( $this->filters ) ) {
			$filters_process = new Contact_Filters_Process( $total_contacts_query, $this->filters );
			$total_contacts  = $filters_process->filter()->count();
		} else {
			$total_contacts = $total_contacts_query->count();
		}

		$contact_fields = $this->get_contact_fields();
		$headers        = array_map(
			function ( $key ) use ( $contact_fields ) {
				return $contact_fields[ $key ]['name'];
			},
			$this->fields
		);

		// Check if file exists
		if ( ! file_exists( $file_path ) ) {
			$csv = Writer::createFromPath( $file_path, 'w+' );
			$csv->insertOne( $headers );
		} else {
			$csv = Writer::createFromPath( $file_path, 'a+' );
		}

		while ( $this->get_current_execution_time() < $this->max_execution_time && ! Utils::is_memory_limit_reached() ) {
			// Usleep is used to prevent the server from crashing
			usleep( 1000000 );

			$contacts_query = Contact_Model::with( 'lists', 'tags' )
				->offset( $this->offset )
				->limit( 10 )
				->orderBy( 'created_at', 'desc' );

			if ( ! empty( $this->filters ) ) {
				$filters_process = new Contact_Filters_Process( $contacts_query, $this->filters );
				$contacts_query  = $filters_process->filter();
			}

			$contacts = $contacts_query->get();

			if ( $contacts->isEmpty() ) {
				break;
			}

			foreach ( $contacts as $contact ) {
				$contact_array = array();
				foreach ( $this->fields as $field ) {
					$contact_array[] = $this->get_field_value( $contact, $field );
				}

				$csv->insertOne( $contact_array );
				$this->offset++;
			}

			if ( $this->offset >= $total_contacts ) {
				break;
			}
		}

		return array(
			'total'  => $total_contacts,
			'offset' => $this->offset,
			'status' => $this->offset >= $total_contacts ? 'completed' : 'in_progress',
		);
	}

	/**
	 * Retrieve and format the field value.
	 *
	 * @param object $contact        The contact object.
	 * @param string $field          The field name.
	 * @return string The formatted field value.
	 */
	private function get_field_value( $contact, $field ) {
		$contact_fields = $this->get_contact_fields();
		if ( ! isset( $contact_fields[ $field ] ) ) {
			return '';
		}

		switch ( $field ) {
			case 'lists':
				return $contact->lists->pluck( 'name' )->implode( ', ' );
			case 'tags':
				return $contact->tags->pluck( 'name' )->implode( ', ' );
			case 'last_open':
				return Utils::format_date( $contact->campaign_emails()->orderBy( 'opened_at', 'desc' )->first()->opened_at ?? '' );
			case 'last_click':
				return Utils::format_date( $contact->campaign_emails()->orderBy( 'clicked_at', 'desc' )->first()->clicked_at ?? '' );
			case 'last_sent':
				return Utils::format_date( $contact->campaign_emails()->orderBy( 'sent_at', 'desc' )->first()->sent_at ?? '' );
			case 'created_at':
			case 'updated_at':
				return Utils::format_date( $contact->$field );
			default:
				if ( $contact_fields[ $field ]['is_custom'] ?? false ) {
					return $contact->get_custom_field( $field );
				}
				return $contact->$field;
		}
	}

	/**
	 * Get contact fields
	 *
	 * @return array
	 */
	public function get_contact_fields() {
		$contact_fields                 = Contact_Fields::instance()->get_fields();
		$contact_fields['lists']        = array(
			'name' => __( 'Lists', 'quillcrm' ),
		);
		$contact_fields['tags']         = array(
			'name' => __( 'Tags', 'quillcrm' ),
		);
		$contact_fields['created_at']   = array(
			'name' => __( 'Created At', 'quillcrm' ),
		);
		$contact_fields['updated_at']   = array(
			'name' => __( 'Updated At', 'quillcrm' ),
		);
		$contact_fields['last_opened']  = array(
			'name' => __( 'Last Open', 'quillcrm' ),
		);
		$contact_fields['last_clicked'] = array(
			'name' => __( 'Last Click', 'quillcrm' ),
		);
		$contact_fields['last_sent']    = array(
			'name' => __( 'Last Sent', 'quillcrm' ),
		);

		return $contact_fields;
	}
}
