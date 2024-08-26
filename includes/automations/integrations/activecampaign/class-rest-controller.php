<?php
/**
 * Class ActiveCampaign Rest Controller
 *
 * This class is responsible for handling the ActiveCampaign REST API
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\ActiveCampaign;

use QuillCRM\Abstracts\REST_Integration_Controller;

/**
 * ActiveCampaign Rest Controller
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
				'api_url' => array(
					'label'       => __( 'API URL', 'quillcrm' ),
					'type'        => 'string',
					'required'    => true,
					'arg_options' => array(
						'sanitize_callback' => 'esc_url_raw',
						'validate_callback' => function( $value ) {
							return filter_var( $value, FILTER_VALIDATE_URL );
						},
					),
				),
				'api_key' => array(
					'label'       => __( 'API Key', 'quillcrm' ),
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
