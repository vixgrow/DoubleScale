<?php

/**
 * Subscription Total Merge Tag
 *
 * This class is responsible for handling the subscription total merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\WooCommerce\Subscription;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Subscription Total Merge Tag
 */
class Subscription_Total extends Merge_Tag {




	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Subscription Total';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'subscription_total';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Subscription Total';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'subscription';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( $contact, $merge_tag = '' ) {
		$subscription_id = $contact->get_data( 'subscription_id' );
		if ( ! $subscription_id ) {
			return '';
		}

		if ( ! function_exists( 'wcs_get_subscription' ) ) {
			return '';
		}

		$subscription = wcs_get_subscription( $subscription_id );
		if ( ! $subscription instanceof \WC_Subscription ) {
			return '';
		}

		return wc_price( $subscription->get_total() );
	}
}

Merge_Tags_Manager::instance()->register( new Subscription_Total() );
