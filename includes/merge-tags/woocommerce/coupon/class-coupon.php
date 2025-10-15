<?php

namespace QuillCRM\Merge_Tags\WooCommerce\Coupon;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Step_Model;

class Coupon extends Merge_Tag {

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
	public $is_automation = true;


	public function __construct( string $name, string $slug ) {
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

		$coupon_code = $step->get_setting( 'coupon_code' );
		if ( ! $coupon_code ) {
			return '';
		}
		return $coupon_code;
	}
}
