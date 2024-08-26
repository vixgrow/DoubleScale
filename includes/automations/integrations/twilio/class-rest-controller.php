<?php
/**
 * Class Twilio Rest Controller
 *
 * This class is responsible for handling the Twilio REST API
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Twilio;

use QuillCRM\Abstracts\REST_Integration_Controller;

/**
 * Twilio Rest Controller
 */
class REST_Controller extends REST_Integration_Controller {

	/**
	 * Get settings schema
	 *
	 * @return array
	 */
	public function get_settings_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'account_sid'  => array(
					'label'       => __( 'Account SID', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'auth_token'   => array(
					'label'       => __( 'Auth Token', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'phone_number' => array(
					'label'       => __( 'Phone Number', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			),
		);
	}
}
