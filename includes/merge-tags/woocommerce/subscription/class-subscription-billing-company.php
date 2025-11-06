<?php
/**
 * Subscription Billing Company Merge Tag
 *
 * This class is responsible for handling the subscription billing company merge tag
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
 * Subscription Billing Company Merge Tag
 */
class Subscription_Billing_Company extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Subscription Billing Company';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'subscription_billing_company';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Subscription Billing Company';

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

		$subscription = wcs_get_subscription( $subscription_id );
		if ( ! $subscription instanceof \WC_Subscription ) {
			return '';
		}

		return $subscription->get_billing_company();
	}
}

Merge_Tags_Manager::instance()->register( new Subscription_Billing_Company() );
