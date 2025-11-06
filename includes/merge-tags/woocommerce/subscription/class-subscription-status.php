<?php

/**
 * Subscription Status Merge Tag
 *
 * This class is responsible for handling the subscription status merge tag
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
 * Subscription Status Merge Tag
 */
class Subscription_Status extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Subscription Status';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'subscription_status';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Subscription Status';

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

		$subscription_status_slug = 'wc-' . $subscription->get_status();
		$subscription_statuses    = wcs_get_subscription_statuses();
		$subscription_status      = $subscription_statuses[ $subscription_status_slug ];

		return $subscription_status ? $subscription_status : '';
	}
}

Merge_Tags_Manager::instance()->register( new Subscription_Status() );
