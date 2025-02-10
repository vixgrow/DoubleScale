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
use QuillCRM\Managers\Actions_Manager;

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

		return true;
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'status' => array(
				'type'    => 'select',
				'label'   => __( 'Order Status', 'quillcrm' ),
				'options' => array(
					'wc-pending'        => __( 'Pending Payment', 'quillcrm' ),
					'wc-processing'     => __( 'Processing', 'quillcrm' ),
					'wc-on-hold'        => __( 'On Hold', 'quillcrm' ),
					'wc-completed'      => __( 'Completed', 'quillcrm' ),
					'wc-cancelled'      => __( 'Cancelled', 'quillcrm' ),
					'wc-refunded'       => __( 'Refunded', 'quillcrm' ),
					'wc-failed'         => __( 'Failed', 'quillcrm' ),
					'wc-checkout-draft' => __( 'Checkout Draft', 'quillcrm' ),
				),
			),
		);
	}

	/**
	 * Get attributes schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'statuses' => array(
					'type'  => 'array',
					'items' => array(
						'type' => 'string',
					),
				),
			),
		);
	}
}

Change_Order_Status::instance();
