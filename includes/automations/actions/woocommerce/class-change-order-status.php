<?php
/**
 * Change Order Status Action
 *
 * This action will change the order status.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions;

use QuillCRM\Abstracts\Action;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Change Order Status Action
 */
class Change_Order_Status extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Change Order Status';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'change_order_status';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will change the order status.';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'woocommerce';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'order';

	/**
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model         $automation Automation Model.
	 * @param Automation_Step_Model    $step Automation Step Model.
	 * @param Automation_Contact_Model $contact Contact Model.
	 *
	 * @return bool
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact ) {
		$order_id = $automation_contact->get_data( 'order_id', null );
		if ( ! $order_id ) {
			return false;
		}

		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return false;
		}

		$status = $automation->get_setting( 'status', '' );
		if ( ! $status ) {
			return false;
		}

		$order->update_status( $status );
	}
}
