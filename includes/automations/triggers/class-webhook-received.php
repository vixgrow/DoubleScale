<?php
/**
 * Webhook Received Trigger
 *
 * This trigger will be fired when a webhook is received.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Automation_Model;

/**
 * Webhook Received
 */
class Webhook_Received extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Webhook Received';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'webhook_received';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a webhook is received.';

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
	public $source = 'crm';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'webhooks';

	/**
	 * Load hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'quillcrm_webhook_received', array( $this, 'webhook_received' ), 10, 2 );
	}

	/**
	 * Webhook Received
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model $automation Automation.
	 * @param array            $payload Payload.
	 *
	 * @return void
	 */
	public function webhook_received( $automation, $payload ) {
		$automation->set_setting( 'payload', $payload );
		$automation->set_setting( 'received_at', current_time( 'mysql' ) );
		$automation->save();

		// Process the automation
		$this->process_webhook_automation( $automation, $payload );
	}

	/**
	 * Process the automation
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model $automation Automation.
	 * @param array            $payload Payload.
	 *
	 * @return void
	 */
	public function process_webhook_automation( $automation, $payload ) {
		$mapped_fields = $automation->get_setting( 'mapped_fields', array() );
		if ( empty( $mapped_fields ) ) {
			return;
		}

		$contact_data = array();
		foreach ( $mapped_fields as $field ) {
			if ( isset( $payload[ $field ] ) ) {
				$contact_data[ $field ] = $payload[ $field ];
			}
		}

		if ( empty( $contact_data ) ) {
			return;
		}

		try {
			$contact = Contact_Model::createOrUpdate( $contact_data );

			$data = array(
				'contact' => $contact,
			);

			$this->process( $data );
		} catch ( \Exception $e ) {
			error_log( 'Error creating contact: ' . $e->getMessage() );
		}
	}

	/**
	 * Set automation attributes
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model $automation Automation.
	 *
	 * @return void
	 */
	public function set_settings( $automation ) {
		// Random string with 32 characters
		$random_string = bin2hex( random_bytes( 16 ) );
		$automation->set_setting( 'webhook_key', $random_string );
		$automation->save();
		error_log( 'Webhook Key: ' . $random_string );
	}
}

Triggers_Manager::instance()->register( new Webhook_Received() );
