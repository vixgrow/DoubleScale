<?php
/**
 * Class Klaviyo Rest Controller
 *
 * This class is responsible for handling the Klaviyo REST API
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Klaviyo;

use QuillCRM\Abstracts\REST_Integration_Controller;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Klaviyo Rest Controller
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
				'api_key' => array(
					'label'       => __( 'API Key', 'quill-crm' ),
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
