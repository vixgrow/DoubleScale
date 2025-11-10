<?php

/**
 * Subscription Billing Address Merge Tag
 *
 * This class is responsible for handling the subscription billing address merge tag
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
 * Subscription Billing Address Merge Tag
 */
class Subscription_Billing_Address extends Merge_Tag {




	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Subscription Billing Address';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'subscription_billing_address';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Subscription Billing Address';

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

		$address = $subscription->get_formatted_billing_address();
		return $address;
	}
}

Merge_Tags_Manager::instance()->register( new Subscription_Billing_Address() );
