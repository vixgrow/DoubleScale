<?php

/**
 * Dynamic Forms Fields Registration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\Forms;

use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Merge_Tags\Forms\Forms_Field;

/**
 * Dynamic Forms Fields Registration
 */
class Dynamic_Fields_Registration {




	/**
	 * Constructor
	 */
	public function __construct( $fields, $slug ) {
		$this->register_fields_from_data( $fields, $slug );
	}

	/**
	 * Register fields from automation data
	 *
	 * @since 1.0.0
	 *
	 * @param array $fields Fields.
	 *
	 * @return void
	 */
	public function register_fields_from_data( $fields, $slug ) {
		if ( ! isset( $fields ) || ! is_array( $fields ) ) {
			return;
		}

		foreach ( $fields as $field_name => $field_label ) {
			// Skip if already registered.
			$existing_merge_tag = Merge_Tags_Manager::instance()->get_merge_tag( $slug, "field:{$field_name}" );
			if ( $existing_merge_tag ) {
				continue;
			}

			$merge_tag = new Forms_Field( $field_name, $field_label, $slug );
			Merge_Tags_Manager::instance()->register( $merge_tag );
		}
	}
}
