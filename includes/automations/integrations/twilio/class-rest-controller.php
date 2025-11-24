<?php
/**
 * Class Twilio Rest Controller (Free Version Stub)
 *
 * This is a stub REST controller for Twilio in the free plugin
 * The Pro plugin will override this with the actual implementation
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Twilio;

use QuillCRM\Abstracts\REST_Integration_Controller;

/**
 * Twilio Rest Controller stub for free plugin
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
					'context'     => array( 'view' ),
					'description' => __( 'Your Twilio Account SID. This feature requires QuillCRM Pro.', 'quillcrm' ),
				),
				'auth_token'   => array(
					'label'       => __( 'Auth Token', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
					'context'     => array(),
					'description' => __( 'Your Twilio Auth Token. This feature requires QuillCRM Pro.', 'quillcrm' ),
				),
				'phone_number' => array(
					'label'       => __( 'Phone Number', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
					'context'     => array( 'view' ),
					'description' => __( 'Your Twilio Phone Number (with country code, e.g., +1234567890). This feature requires QuillCRM Pro.', 'quillcrm' ),
				),
			),
		);
	}
}

