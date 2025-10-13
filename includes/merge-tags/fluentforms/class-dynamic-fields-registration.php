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
use QuillCRM\Merge_Tags\Forms\Forms_Field;
use QuillCRM\Merge_Tags\Forms\Forms_Metadata;

/**
 * Dynamic FluentForms Fields Registration
 */
class Dynamic_Fields_Registration {



	/**
	 * Constructor
	 */
	public function __construct( $fields, $slug ) {
		$this->register_form_metadata_tags( $slug );
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

	/**
	 * Register form metadata merge tags (form_title, form_id)
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug Form slug
	 *
	 * @return void
	 */
	public function register_form_metadata_tags( $slug ) {
		// Register form_title merge tag
		$existing_title_tag = Merge_Tags_Manager::instance()->get_merge_tag( $slug, 'form_title' );
		if ( ! $existing_title_tag ) {
			$title_merge_tag = new Forms_Metadata( 'form_title', 'Form Title', $slug );
			Merge_Tags_Manager::instance()->register( $title_merge_tag );
		}

		// Register form_id merge tag
		$existing_id_tag = Merge_Tags_Manager::instance()->get_merge_tag( $slug, 'form_id' );
		if ( ! $existing_id_tag ) {
			$id_merge_tag = new Forms_Metadata( 'form_id', 'Form ID', $slug );
			Merge_Tags_Manager::instance()->register( $id_merge_tag );
		}
	}
}
