<?php

/**
 * Class Slack Rest Controller (Free Version Stub)
 *
 * This is a stub REST controller for the free plugin
 * The Pro plugin will override this with the actual implementation
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Slack;

use QuillCRM\Abstracts\REST_Integration_Controller;

/**
 * Slack Rest Controller stub for free plugin
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
				'app' => array(
					'type'       => 'object',
					'context'    => array( 'view' ),
					'properties' => array(
						'client_id'     => array(
							'label'       => __( 'Client ID', 'quillcrm' ),
							'type'        => 'string',
							'required'    => true,
							'context'     => array( 'view' ),
							'description' => __( 'Your Slack App Client ID. This feature requires QuillCRM Pro.', 'quillcrm' ),
						),
						'client_secret' => array(
							'label'       => __( 'Client Secret', 'quillcrm' ),
							'type'        => 'string',
							'required'    => true,
							'context'     => array(),
							'description' => __( 'Your Slack App Client Secret. This feature requires QuillCRM Pro.', 'quillcrm' ),
						),
					),
				),
			),
		);
	}
}
