<?php
/**
 * Class Convertkit Rest Controller
 *
 * This class is responsible for handling the Convertkit REST Api
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Integrations\Convertkit;

use DoubleScale\Modules\Integrations\Abstracts\RestIntegrationController;

/**
 * Convertkit Rest Controller
 */
class RestController extends RestIntegrationController {

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
					'label'       => __( 'Api Secret', 'doublescale'),
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
