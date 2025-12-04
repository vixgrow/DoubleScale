<?php

/**
 * FluentCRM Importer
 *
 * This class is responsible for handling the FluentCRM importer
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Import_Export\Importers;

use QuillCRM\Abstracts\Importer;

/**
 * FluentCRM Importer class
 */
class FluentCRM extends Importer {



	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'FluentCRM';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'fluentcrm';

	/**
	 * Is Integration
	 *
	 * @var bool
	 */
	protected $is_integration = true;

	/**
	 * Is Active
	 *
	 * @var bool
	 */
	public function is_active() {
		return quillcrm_is_plugin_active( 'fluent-crm/fluent-crm.php' );
	}

	/**
	 * Run importer
	 */
	public function run() {
		 global $wpdb;

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
	 * Get tags
	 *
	 * @return array
	 */
	public function get_tags() {
		global $wpdb;

		$tags_table = $wpdb->prefix . 'fc_tags';
		$tags       = $wpdb->get_results( "SELECT * FROM $tags_table" );

		$tags_array = array();
		foreach ( $tags ?? array() as $tag ) {
			$tags_array[] = array(
				'key'   => $tag->title,
				'label' => $tag->title,
			);
		}

		return $tags_array;
	}

	/**
	 * Get lists
	 *
	 * @return array
	 */
	public function get_lists() {
		global $wpdb;

		$lists_table = $wpdb->prefix . 'fc_lists';
		$lists       = $wpdb->get_results( "SELECT * FROM $lists_table" );

		$lists_array = array();
		foreach ( $lists ?? array() as $list ) {
			$lists_array[] = array(
				'key'   => $list->title,
				'label' => $list->title,
			);
		}

		return $lists_array;
	}

	/**
	 * Get fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'lists_mapping' => array(
				'type'    => 'lists_mapping',
				'label'   => __( 'Lists Mapping', 'quillcrm' ),
				'options' => $this->get_lists(),
				'tooltip' => __( 'Map FluentCRM lists to QuillCRM lists. For each FluentCRM list, you can either: 1) "Assign to (QuillCRM)" - Choose one or more existing QuillCRM lists to add contacts to (useful for renaming or consolidating lists), or 2) "Auto Create" - Automatically create a new QuillCRM list with the same name as the FluentCRM list (useful for preserving your original list structure). Contacts will only be added to lists they belonged to in FluentCRM.', 'quillcrm' ),
			),
			'tags_mapping'  => array(
				'type'    => 'tags_mapping',
				'label'   => __( 'Tags Mapping', 'quillcrm' ),
				'options' => $this->get_tags(),
				'tooltip' => __( 'Map FluentCRM tags to QuillCRM tags. For each FluentCRM tag, you can either: 1) "Assign to (QuillCRM)" - Choose one or more existing QuillCRM tags to apply to contacts (useful for renaming or consolidating tags), or 2) "Auto Create" - Automatically create a new QuillCRM tag with the same name as the FluentCRM tag (useful for preserving your original tag structure). Contacts will only receive tags they had in FluentCRM.', 'quillcrm' ),
			),
		);
	}
}
