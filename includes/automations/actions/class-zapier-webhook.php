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

		// Decode data fields if needed
		$data_fields = $this->decode_data_fields( $data_fields );

		if ( empty( $webhook_url ) ) {
			quillcrm_get_logger()->error(
				\__( 'Zapier Webhook action is missing webhook URL.', 'quillcrm' ),
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
		if ( ! \filter_var( $webhook_url, \FILTER_VALIDATE_URL ) ) {
			quillcrm_get_logger()->error(
				\__( 'Zapier Webhook action has invalid webhook URL.', 'quillcrm' ),
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
			if ( isset( $data_fields[0] ) && is_array( $data_fields[0] ) && isset( $data_fields[0]['key'] ) ) {
				foreach ( $data_fields as $pair ) {
					if ( ! empty( $pair['key'] ) && ! empty( $pair['value'] ) ) {
						// Process merge tags in the value
						$processed_value                = $this->merge_tags_manager->process_merge_tags( $pair['value'], $automation_contact );
						$processed_data[ $pair['key'] ] = $processed_value;
					}
				}
			}
		}

		// Send data to webhook
		$response = \wp_remote_post(
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
				'body'        => \wp_json_encode( $processed_data ),
				'cookies'     => array(),
			)
		);

		if ( \is_wp_error( $response ) ) {
			quillcrm_get_logger()->error(
				\__( 'Zapier Webhook action failed to send data.', 'quillcrm' ),
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

		$response_code = \wp_remote_retrieve_response_code( $response );
		$response_body = \wp_remote_retrieve_body( $response );

		if ( $response_code < 200 || $response_code >= 300 ) {
			quillcrm_get_logger()->error(
				\__( 'Zapier Webhook action received error response.', 'quillcrm' ),
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
			\__( 'Zapier Webhook action successfully sent data.', 'quillcrm' ),
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
			'webhook_url'  => array(
				'label'       => \__( 'Webhook URL', 'quillcrm' ),
				'type'        => 'text',
				'placeholder' => 'https://hooks.zapier.com/hooks/catch/...',
				'description' => \__( 'Enter your Zapier webhook URL', 'quillcrm' ),
			),
			'data_fields'  => array(
				'type'        => 'dynamic_keyvalue',
				'label'       => \__( 'Data', 'quillcrm' ),
				'description' => \__( 'Add custom key-value pairs to send to the webhook. Keys will be used as field names in the payload.', 'quillcrm' ),
			),
			'test_webhook' => array(
				'type'        => 'button',
				'label'       => \__( 'Test Webhook', 'quillcrm' ),
				'description' => \__( 'Test the webhook by sending a test payload.', 'quillcrm' ),
				'settings'    => array(
					'ajax_action' => 'quillcrm_test_zapier_webhook',
					'button_text' => \__( 'Send Test Data', 'quillcrm' ),
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

	/**
	 * Register hooks
	 *
	 * @since 1.0.0
	 */
	public function register() {
		parent::register();

		// Register AJAX handler for test webhook functionality
		\add_action( 'wp_ajax_quillcrm_test_zapier_webhook', array( $this, 'ajax_test_webhook' ) );
	}

	/**
	 * AJAX handler for testing webhook
	 *
	 * @since 1.0.0
	 */
	public function ajax_test_webhook() {
		// Check nonce for security
		\check_ajax_referer( 'wp_rest', 'nonce' );

		// Call the test webhook method
		$result = $this->test_webhook();

		// Send JSON response
		if ( $result['success'] ) {
			\wp_send_json_success( $result['data'] );
		} else {
			\wp_send_json_error( $result['data'] );
		}
	}

	/**
	 * Safely decode JSON data fields, handling WordPress escaping
	 *
	 * @param mixed $data_fields The data fields to decode
	 * @return array The decoded data fields
	 */
	private function decode_data_fields( $data_fields ) {
		// If already an array, return as-is
		if ( \is_array( $data_fields ) ) {
			return $data_fields;
		}

		// If not a string, return empty array
		if ( ! \is_string( $data_fields ) ) {
			return array();
		}

		// Try to decode as-is first
		$decoded_data = \json_decode( $data_fields, true );

		// If first attempt failed, try with stripslashes (in case WordPress added slashes)
		if ( \json_last_error() !== JSON_ERROR_NONE ) {
			$stripped_data = \stripslashes( $data_fields );
			$decoded_data  = \json_decode( $stripped_data, true );
		}

		// If still failed, try double stripslashes (in case of double escaping)
		if ( \json_last_error() !== JSON_ERROR_NONE ) {
			$double_stripped = \stripslashes( \stripslashes( $data_fields ) );
			$decoded_data    = \json_decode( $double_stripped, true );
		}

		// Return decoded data if successful, otherwise empty array
		$result = ( \json_last_error() === JSON_ERROR_NONE && $decoded_data !== null ) ? $decoded_data : array();
		return $result;
	}

	/**
	 * Test webhook functionality
	 *
	 * @return array
	 */
	public function test_webhook() {
		// Get webhook URL from POST data
		$webhook_url = isset( $_POST['webhook_url'] ) ? \sanitize_url( $_POST['webhook_url'] ) : '';
		$data_fields = isset( $_POST['data_fields'] ) ? $_POST['data_fields'] : array();

		// Decode data fields if needed
		$data_fields = $this->decode_data_fields( $data_fields );

		if ( empty( $webhook_url ) ) {
			return array(
				'success' => false,
				'data'    => array(
					'message' => \__( 'Webhook URL is required for testing.', 'quillcrm' ),
				),
			);
		}

		// Validate webhook URL
		if ( ! \filter_var( $webhook_url, \FILTER_VALIDATE_URL ) ) {
			return array(
				'success' => false,
				'data'    => array(
					'message' => \__( 'Invalid webhook URL provided.', 'quillcrm' ),
				),
			);
		}

		// Prepare test data
		$test_data = array();

		// Process custom data fields if provided
		if ( ! empty( $data_fields ) && \is_array( $data_fields ) ) {
			foreach ( $data_fields as $pair ) {
				if ( ! empty( $pair['key'] ) && ! empty( $pair['value'] ) ) {

					$pair['value'] = preg_replace( '/\{\{.*?\}\}/', '', $pair['value'] );

					$pair['value'] = trim( preg_replace( '/\s+/', ' ', $pair['value'] ) );

					$test_data[ \sanitize_text_field( $pair['key'] ) ] = \sanitize_text_field( $pair['value'] );
				}
			}
		}

		// Send test data to webhook
		$response = \wp_remote_post(
			$webhook_url,
			array(
				'method'      => 'POST',
				'timeout'     => 30,
				'redirection' => 5,
				'httpversion' => '1.0',
				'blocking'    => true,
				'headers'     => array(
					'Content-Type' => 'application/json',
					'User-Agent'   => 'QuillCRM/' . QUILLCRM_VERSION . ' (Test)',
				),
				'body'        => \wp_json_encode( $test_data ),
				'cookies'     => array(),
			)
		);

		if ( \is_wp_error( $response ) ) {
			return array(
				'success' => false,
				'data'    => array(
					'message' => \sprintf(
						\__( 'Failed to send test data: %s', 'quillcrm' ),
						$response->get_error_message()
					),
				),
			);
		}

		$response_code = \wp_remote_retrieve_response_code( $response );
		$response_body = \wp_remote_retrieve_body( $response );

		if ( $response_code < 200 || $response_code >= 300 ) {
			return array(
				'success' => false,
				'data'    => array(
					'message' => \sprintf(
						\__( 'Webhook returned error status %1$d: %2$s', 'quillcrm' ),
						$response_code,
						$response_body
					),
				),
			);
		}

		return array(
			'success' => true,
			'data'    => array(
				'message' => \__( 'Test data sent successfully!', 'quillcrm' ),
			),
		);
	}
}



Zapier_Webhook::instance();
