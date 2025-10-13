<?php

/**
 * Dynamic FluentForms Fields Registration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\FluentForms;

use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Dynamic FluentForms Fields Registration
 */
class Dynamic_Fields_Registration {



	/**
	 * Constructor
	 */
	public function __construct( $fields ) {
		$this->register_fields_from_data( $fields );
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
	public function register_fields_from_data( $fields ) {
		if ( ! isset( $fields ) || ! is_array( $fields ) ) {
			return;
		}

		foreach ( $fields as $field_name => $field_label ) {
			// Skip if already registered.
			$existing_merge_tag = Merge_Tags_Manager::instance()->get_merge_tag( 'fluentforms', "field:{$field_name}" );
			if ( $existing_merge_tag ) {
				continue;
			}

			$merge_tag = new FluentForms_Field( $field_name, $field_label );
			Merge_Tags_Manager::instance()->register( $merge_tag );
		}
	}
}
