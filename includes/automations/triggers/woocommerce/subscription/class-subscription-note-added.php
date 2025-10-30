<?php

/**
 * WooCommerce Subscription Note Added Trigger
 * This trigger will be fired when a note is added to a subscription.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce\Subscription;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Models\Automation_Model;
use WC_Subscription;

/**
 * Subscription Note Added Trigger
 */
class Subscription_Note_Added extends Trigger {



	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Subscription Note Added';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_subscription_note_added';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a note is added to a subscription.';

	/**
	 * Trigger Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'woocommerce';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'subscription';

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'woocommerce_order_note_added', array( $this, 'subscription_note_added' ), 10, 2 );
	}

	/**
	 * Subscription Note Added
	 *
	 * @since 1.0.0
	 *
	 * @param WC_Subscription $subscription Subscription object.
	 * @param array           $note Note data.
	 * @return void
	 */
	public function subscription_note_added( $note_id, $subscription ) {
		$note = get_comment( $note_id );
		if ( ! $note || ! $subscription instanceof \WC_Subscription ) {
			return;
		}

		$note_type    = $note->comment_type ?? '';
		$note_content = $note->comment_content ?? '';
		$note_author  = $note->comment_author ?? '';

		$data = array(
			'first_name' => $subscription->get_billing_first_name(),
			'last_name'  => $subscription->get_billing_last_name(),
			'email'      => $subscription->get_billing_email(),
			'data'       => array(
				'subscription_id' => $subscription->get_id(),
				'note_id'         => $note_id,
				'note_content'    => $note_content,
				'note_type'       => $note_type,
				'note_author'     => $note_author,
			),
		);
		$this->process( $data );
	}


	/**
	 * Is Processable
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model $automation
	 * @param array            $args
	 *
	 * @return bool
	 */
	public function is_processable( Automation_Model $automation, $args ) {
		$note_type     = $args['data']['note_type'] ?? '';
		$selected_type = $automation->get_setting( 'note_type', 'both' );

		if ( $selected_type !== 'both' && $selected_type !== $note_type ) {
			return false;
		}
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
			'note_type' => array(
				'type'        => 'select',
				'label'       => __( 'Note Type', 'quillcrm' ),
				'description' => __( 'Select which note type to trigger for.', 'quillcrm' ),
				'options'     => array(
					'both'          => __( 'Both', 'quillcrm' ),
					'customer_note' => __( 'Customer', 'quillcrm' ),
					'order_note'    => __( 'Private', 'quillcrm' ),
				),
				'default'     => 'both',
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
				'note_type' => array(
					'type' => 'string',
				),
			),
		);
	}
}

Triggers_Manager::instance()->register( new Subscription_Note_Added() );
