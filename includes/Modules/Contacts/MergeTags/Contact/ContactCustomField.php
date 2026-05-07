<?php
/**
 * Contact Custom Field
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Contacts\MergeTags\Contact;

use DoubleScale\Modules\Automations\Abstracts\MergeTag;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Managers\MergeTagsManager;
use DoubleScale\Core\CustomFields\Models\CustomFieldModel;

/**
 * Contact Custom Field
 */
class ContactCustomField extends MergeTag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name;

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug;

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description;

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'contact';

	/**
	 * Is automation merge tag
	 *
	 * @var bool
	 */
	public $is_automation = false;

	/**
	 * Constructor
	 *
	 * @param CustomFieldModel $custom_field Custom Field Model.
	 */
	public function __construct( CustomFieldModel $custom_field ) {
		$this->name        = $custom_field->name;
		$this->slug        = "contact_field:{$custom_field->slug}";
		$this->description = $custom_field->name;
	}

	/**
	 * Get Merge Tag Value
	 *
	 * @param ContactModel $contact Contact Model.
	 * @param string        $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		if ( is_null( $contact ) ) {
			return '';
		}

		$key             = str_replace( 'contact_field:', '', $merge_tag );
		$custom_field_id = CustomFieldModel::get_id( $key );
		$custom_field    = $contact->get_custom_field( $custom_field_id );

		if ( $custom_field ) {
			return $custom_field;
		}

		return '';
	}
}

// Register custom fields as merge tags.
$custom_fields = CustomFieldModel::all();

foreach ( $custom_fields as $custom_field ) {
	MergeTagsManager::instance()->register( new ContactCustomField( $custom_field ) );
}
