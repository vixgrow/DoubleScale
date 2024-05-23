<?php
/**
 * Class Order Currency
 *
 * This class is responsible for handling the order currency merge tag
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Merge_Tags\EDD\Order;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Order Currency Merge Tag
 */
class Order_Currency extends Merge_Tag {

	/**
	 * Merge Tag Name
	 *
	 * @var string
	 */
	public $name = 'Order Currency';

	/**
	 * Merge Tag Slug
	 *
	 * @var string
	 */
	public $slug = 'currency';

	/**
	 * Merge Tag Description
	 *
	 * @var string
	 */
	public $description = 'Order Currency';

	/**
	 * Merge Tag Group
	 *
	 * @var string
	 */
	public $group = 'edd_order';

	/**
	 * Get Merge Tag Value
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 * @param string                   $merge_tag Merge Tag.
	 *
	 * @return string
	 */
	public function get_value( Automation_Contact_Model $automation_contact, $merge_tag = '' ) {
		$payment_id = $automation_contact->get_data( 'payment_id' );

		$currency = edd_get_payment_currency_code( $payment_id );

		return $currency;
	}
}

Merge_Tags_Manager::instance()->register( new Order_Currency() );
