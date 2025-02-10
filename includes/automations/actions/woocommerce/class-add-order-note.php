<?php
/**
 * Add Order Note Action
 *
 * This action will add a note to the order.
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
 * Add Order Note Action
 */
class Add_Order_Note extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add Order Note';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'add_order_note';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a note to the order.';

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
	 * @param Automation_Model         $automation
	 * @param Automation_Step_Model    $step
	 * @param Automation_Contact_Model $contact
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
		$note = $step->get_setting( 'note', '' );
		$order->add_order_note( $note );

		return true;
	}

	/**
	 * Get fields.
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			array(
				'name'    => 'note',
				'label'   => __( 'Note', 'quillcrm' ),
				'type'    => 'textarea',
				'default' => '',
			),
		);
	}
}

Add_Order_Note::instance();
