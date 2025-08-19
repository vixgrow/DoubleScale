<?php

/**
 * Zapier Webhook Action
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Zapier Webhook Action
 */
class Zapier_Webhook extends Action {


	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Send to Zapier Webhook';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'zapier_webhook';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'send_data';

	/**
	 * Trigger Group
	 *
	 * @var string
	 */
	public $group = 'zapier';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will send data to a Zapier webhook URL with custom key-value pairs and merge tag support.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model         $automation Automation Model.
	 * @param Automation_Step_Model    $step Automation Step Model.
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 *
	 * @return bool
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact ) {
		$webhook_url = $step->get_setting( 'webhook_url', '' );
		$data_fields = $step->get_setting( 'data_fields', array() );

		if ( empty( $webhook_url ) ) {
			quillcrm_get_logger()->error(
				__( 'Zapier Webhook action is missing webhook URL.', 'quillcrm' ),
				array(
					'code' => 'zapier_webhook_missing_url',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id' => $step->id,
						),
					),
				)
			);
			return false;
		}

		// Validate webhook URL
		if ( ! filter_var( $webhook_url, FILTER_VALIDATE_URL ) ) {
			quillcrm_get_logger()->error(
				__( 'Zapier Webhook action has invalid webhook URL.', 'quillcrm' ),
				array(
					'code' => 'zapier_webhook_invalid_url',
					'data' => array(
						'automation'  => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'        => array(
							'id' => $step->id,
						),
						'webhook_url' => $webhook_url,
					),
				)
			);
			return false;
		}

		// Process custom data or use default contact data
		$processed_data = array();

		if ( ! empty( $data_fields ) && is_array( $data_fields ) ) {
			// Handle both old format (object) and new format (array of key-value pairs)
			if ( isset( $data_fields[0] ) && is_array( $data_fields[0] ) && isset( $data_fields[0]['key'] ) ) {
				// New format: array of key-value pairs from DynamicKeyValueInput
				foreach ( $data_fields as $pair ) {
					if ( ! empty( $pair['key'] ) && ! empty( $pair['value'] ) ) {
						// Process merge tags in the value
						$processed_value                = $this->merge_tags_manager->process_merge_tags( $pair['value'], $automation_contact );
						$processed_data[ $pair['key'] ] = $processed_value;
					}
				}
			} else {
				// Old format: object with key-value pairs (backward compatibility)
				foreach ( $data_fields as $key => $value ) {
					if ( ! empty( $value ) ) {
						// Process merge tags in the value
						$processed_value        = $this->merge_tags_manager->process_merge_tags( $value, $automation_contact );
						$processed_data[ $key ] = $processed_value;
					}
				}
			}
		}

		// Add contact data if no custom fields provided
		if ( empty( $processed_data ) ) {
			$contact        = $automation_contact->contact;
			$processed_data = array(
				'email'      => $contact->email ?? '',
				'first_name' => $contact->first_name ?? '',
				'last_name'  => $contact->last_name ?? '',
				'status'     => $contact->status ?? '',
			);
		}

		// Add automation context to data
		$processed_data['automation_id']   = $automation->id;
		$processed_data['automation_name'] = $automation->name;
		$processed_data['timestamp']       = current_time( 'mysql' );

		// Send data to webhook
		$response = wp_remote_post(
			$webhook_url,
			array(
				'method'      => 'POST',
				'timeout'     => 30,
				'redirection' => 5,
				'httpversion' => '1.0',
				'blocking'    => true,
				'headers'     => array(
					'Content-Type' => 'application/json',
					'User-Agent'   => 'QuillCRM/' . QUILLCRM_VERSION,
				),
				'body'        => wp_json_encode( $processed_data ),
				'cookies'     => array(),
			)
		);

		if ( is_wp_error( $response ) ) {
			quillcrm_get_logger()->error(
				__( 'Zapier Webhook action failed to send data.', 'quillcrm' ),
				array(
					'code' => 'zapier_webhook_request_failed',
					'data' => array(
						'automation'  => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'        => array(
							'id' => $step->id,
						),
						'webhook_url' => $webhook_url,
						'error'       => $response->get_error_message(),
					),
				)
			);
			return false;
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		$response_body = wp_remote_retrieve_body( $response );

		if ( $response_code < 200 || $response_code >= 300 ) {
			quillcrm_get_logger()->error(
				__( 'Zapier Webhook action received error response.', 'quillcrm' ),
				array(
					'code' => 'zapier_webhook_error_response',
					'data' => array(
						'automation'    => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'          => array(
							'id' => $step->id,
						),
						'webhook_url'   => $webhook_url,
						'response_code' => $response_code,
						'response_body' => $response_body,
					),
				)
			);
			return false;
		}

		quillcrm_get_logger()->info(
			__( 'Zapier Webhook action successfully sent data.', 'quillcrm' ),
			array(
				'code' => 'zapier_webhook_success',
				'data' => array(
					'automation'    => array(
						'id'   => $automation->id,
						'name' => $automation->name,
					),
					'step'          => array(
						'id' => $step->id,
					),
					'webhook_url'   => $webhook_url,
					'response_code' => $response_code,
					'sent_data'     => $processed_data,
				),
			)
		);

		return true;
	}


	/**
	 * Get fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'webhook_url' => array(
				'label'       => __( 'Webhook URL', 'quillcrm' ),
				'type'        => 'text',
				'placeholder' => 'https://hooks.zapier.com/hooks/catch/...',
				'description' => __( 'Enter your Zapier webhook URL', 'quillcrm' ),
			),
			'data_fields' => array(
				'type'        => 'dynamic_keyvalue',
				'label'       => __( 'Custom Data Fields', 'quillcrm' ),
				'description' => __( 'Add custom key-value pairs to send to the webhook. Keys will be used as field names in the payload.', 'quillcrm' ),
				'settings'    => array(
					'max_pairs'         => 20,
					'key_placeholder'   => __( 'Field name (e.g., customer_email)', 'quillcrm' ),
					'value_placeholder' => __( 'Value or merge tag (e.g., {{contact.email}})', 'quillcrm' ),
					'key_label'         => __( 'Field Name', 'quillcrm' ),
					'value_label'       => __( 'Value/Merge Tag', 'quillcrm' ),
					'allow_empty'       => true,
				),
			),
		);
	}


	/**
	 * Get attributes schema
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'webhook_url' => array(
					'type'     => 'string',
					'required' => true,
				),
				'data_fields' => array(
					'type'        => 'array',
					'description' => 'Array of key-value pairs for webhook data',
					'items'       => array(
						'type'       => 'object',
						'properties' => array(
							'id'    => array( 'type' => 'string' ),
							'key'   => array( 'type' => 'string' ),
							'value' => array( 'type' => 'string' ),
						),
						'required'   => array( 'id', 'key' ),
					),
					'default'     => array(),
				),

			),
		);
	}
}



Zapier_Webhook::instance();
