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
		$meta_table  = $wpdb->prefix . 'fc_subscriber_meta';

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
			function ( $offset ) use ( $wpdb, $table_name, $pivot_table, $list_table, $tag_table, $meta_table ) {
				$subscribers = $wpdb->get_results(
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

				// Fetch custom fields (meta) for each subscriber
				foreach ( $subscribers as &$subscriber ) {
					$meta = $wpdb->get_results(
						$wpdb->prepare(
							"SELECT `key`, value FROM $meta_table WHERE subscriber_id = %d AND object_type = 'custom_field'",
							$subscriber['id']
						),
						ARRAY_A
					);

					// Add meta fields to subscriber array
					foreach ( $meta as $meta_item ) {
						$subscriber[ $meta_item['key'] ] = $meta_item['value'];
					}
				}

				return $subscribers;
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
	 * Get imported custom fields
	 *
	 * @return array
	 */
	public function get_imported_custom_fields() {
		global $wpdb;

		$fc_meta_table = $wpdb->prefix . 'fc_meta';

		// Get custom field definitions from FluentCRM meta table
		$custom_fields_data = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT value FROM $fc_meta_table WHERE object_type = %s AND `key` = %s",
				'option',
				'contact_custom_fields'
			)
		);

		if ( $custom_fields_data ) {
			return maybe_unserialize( $custom_fields_data );
		}

		return array();
	}

	/**
	 * Get custom fields
	 *
	 * @return array
	 */
	public function get_custom_fields() {
		$custom_fields = $this->get_imported_custom_fields();
		// Map FluentCRM field types to QuillCRM field types
		$type_mapping = array(
			'text'         => 'text',
			'textarea'     => 'textarea',
			'number'       => 'number',
			'select-one'   => 'select',
			'select-multi' => 'multiselect',
			'date'         => 'date',
			'email'        => 'email',
			'phone'        => 'phone',
			'url'          => 'url',
		);

		$fields_array = array();

		if ( $custom_fields ) {
			if ( is_array( $custom_fields ) ) {
				foreach ( $custom_fields as $field ) {
					$field_type  = $field['type'] ?? '';
					$field_key   = $field['slug'] ?? '';
					$field_label = $field['label'] ?? $field['slug'] ?? $field_key;
					$field_group = $field['group'] ?? '';

					// Get options for select, radio, checkbox fields
					$field_options = array();
					if ( isset( $field['options'] ) && is_array( $field['options'] ) ) {
						$field_options = $field['options'];
					}

					// Only include fields with types that exist in QuillCRM
					if ( ! empty( $field_key ) && isset( $type_mapping[ $field_type ] ) ) {
						$field_data = array(
							'key'      => $field_key,
							'label'    => $field_label,
							'type'     => $type_mapping[ $field_type ],
							'raw_type' => $field_type,
							'group'    => $field_group,
						);

						// Add options for fields that support them
						if ( ! empty( $field_options ) ) {
							$field_data['options'] = $field_options;
						}

						$fields_array[] = $field_data;
					}
				}
			}
		}

		return $fields_array;
	}

	/**
	 * Get fields
	 *
	 * @return array
	 */
	public function get_fields() {
		$fields = array(
			'lists_mapping'         => array(
				'type'    => 'lists_mapping',
				'label'   => __( 'Lists Mapping', 'quillcrm' ),
				'options' => $this->get_lists(),
				'tooltip' => __( 'Map FluentCRM lists to QuillCRM lists. For each FluentCRM list, you can either: 1) "Assign to (QuillCRM)" - Choose one or more existing QuillCRM lists to add contacts to (useful for renaming or consolidating lists), or 2) "Auto Create" - Automatically create a new QuillCRM list with the same name as the FluentCRM list (useful for preserving your original list structure). Contacts will only be added to lists they belonged to in FluentCRM.', 'quillcrm' ),
			),
			'tags_mapping'          => array(
				'type'    => 'tags_mapping',
				'label'   => __( 'Tags Mapping', 'quillcrm' ),
				'options' => $this->get_tags(),
				'tooltip' => __( 'Map FluentCRM tags to QuillCRM tags. For each FluentCRM tag, you can either: 1) "Assign to (QuillCRM)" - Choose one or more existing QuillCRM tags to apply to contacts (useful for renaming or consolidating tags), or 2) "Auto Create" - Automatically create a new QuillCRM tag with the same name as the FluentCRM tag (useful for preserving your original tag structure). Contacts will only receive tags they had in FluentCRM.', 'quillcrm' ),
			),
			'custom_fields_mapping' => array(
				'type'    => 'custom_fields_mapping',
				'label'   => __( 'Custom Fields Mapping', 'quillcrm' ),
				'options' => $this->get_custom_fields(),
				'tooltip' => __( 'Map FluentCRM custom fields to QuillCRM custom fields. For each FluentCRM custom field, you can either: 1) "Assign to (QuillCRM)" - Choose one or more existing QuillCRM custom fields to map the data to (useful for renaming or consolidating fields), or 2) "Auto Create" - Automatically create a new QuillCRM custom field with the same name as the FluentCRM field (useful for preserving your original field structure). Only contacts with values in these fields will have them imported.', 'quillcrm' ),
			),
		);
		return $fields;
	}
}
