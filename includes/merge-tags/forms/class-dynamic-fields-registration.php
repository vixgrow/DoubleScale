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
use QuillCRM\Merge_Tags\Forms\Forms_Metadata;

/**
 * Dynamic Forms Fields Registration
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
	public function register_fields_from_data( $fields, $slug ) {
		if ( ! isset( $fields ) || ! is_array( $fields ) ) {
			return;
		}

		foreach ( $fields as $field_name => $field_label ) {
			$merge_tag = new Forms_Field( $field_name, $field_label['label'], $slug );
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

		$title_merge_tag = new Forms_Metadata( 'form_title', 'Form Title', $slug );
		Merge_Tags_Manager::instance()->register( $title_merge_tag );

		$id_merge_tag = new Forms_Metadata( 'form_id', 'Form ID', $slug );
		Merge_Tags_Manager::instance()->register( $id_merge_tag );
	}
}
