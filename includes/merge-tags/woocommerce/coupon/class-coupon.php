<?php

namespace QuillCRM\Merge_Tags\WooCommerce\Coupon;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

class Coupon extends Merge_Tag {


	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Coupon';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'dynamic_id_';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Coupon';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'coupon';


	/**
	 * Is automation merge tag
	 *
	 * @var bool
	 */
	public $is_automation = false;


	/**
	 * Constructor
	 *
	 * @param string $name Name.
	 * @param string $slug Slug.
	 */
	public function __construct( $name = 'Coupon', $slug = 'dynamic_id_' ) {
		$this->name = $name;
		$this->slug = $slug;
	}


	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $contact Contact Model. Contact Model.
	 * @param string                   $merge_tag         Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$step_id = str_replace( 'dynamic_id_', '', $merge_tag );
		$step    = Automation_Step_Model::find( $step_id );
		if ( ! $step ) {
			return '';
		}

		$automation_contact = Automation_Contact_Model::find( $contact->id );
		if ( ! $automation_contact ) {
			return '';
		}

		$coupon_codes = $automation_contact->get_data( 'coupon_codes', array() );
		if ( empty( $coupon_codes ) ) {
			return '';
		}

		foreach ( $coupon_codes as $coupon_code ) {
			if ( $coupon_code['step_id'] === $step->id ) {
				return $coupon_code['code'];
			}
		}

		return '';
	}
}

Merge_Tags_Manager::instance()->register( new Coupon() );
