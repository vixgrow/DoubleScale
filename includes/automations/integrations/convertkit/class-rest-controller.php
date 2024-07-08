<?php
/**
 * Class Convertkit Rest Controller
 *
 * This class is responsible for handling the Convertkit REST API
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Convertkit;

use QuillCRM\Abstracts\REST_Integration_Controller;

/**
 * Convertkit Rest Controller
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
				'api_secret' => array(
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
