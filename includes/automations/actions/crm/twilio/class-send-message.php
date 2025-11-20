<?php
/**
 * Class Twilio Send Message
 *
 * This class is responsible for sending a message using Twilio
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Twilio;

use QuillCRM\Abstracts\Action_Pro;
use QuillCRM\Managers\Actions_Manager;

/**
 * Twilio Send Message class (Pro Feature)
 */
class Send_Message extends Action_Pro {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Send Message';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'twilio_send_message';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'send_data';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'twilio';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'Send SMS messages using Twilio with full tracking and analytics. Available in QuillCRM Pro.';


	/**
	 * Get attributes schema
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'message'      => array(
					'type'     => 'string',
					'required' => true,
				),
				'to'           => array(
					'type'     => 'string',
					'required' => true,
				),
				'media_url'    => array(
					'type'     => 'string',
					'required' => false,
				),
				'add_utm'      => array(
					'type'     => 'boolean',
					'required' => false,
				),
				'utm_source'   => array(
					'type'     => 'string',
					'required' => false,
				),
				'utm_medium'   => array(
					'type'     => 'string',
					'required' => false,
				),
				'utm_campaign' => array(
					'type'     => 'string',
					'required' => false,
				),
				'utm_term'     => array(
					'type'     => 'string',
					'required' => false,
				),
			),
		);
	}

	/**
	 * Get fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'message'      => array(
				'type'  => 'textarea',
				'label' => __( 'Message', 'quillcrm' ),
			),
			'to'           => array(
				'type'  => 'text',
				'label' => __( 'To', 'quillcrm' ),
			),
			'media_url'    => array(
				'type'  => 'text',
				'label' => __( 'Media URL', 'quillcrm' ),
			),
			'add_utm'      => array(
				'type'  => 'checkbox',
				'label' => __( 'Add UTM', 'quillcrm' ),
			),
			'utm_source'   => array(
				'type'  => 'text',
				'label' => __( 'UTM Source', 'quillcrm' ),
			),
			'utm_medium'   => array(
				'type'  => 'text',
				'label' => __( 'UTM Medium', 'quillcrm' ),
			),
			'utm_campaign' => array(
				'type'  => 'text',
				'label' => __( 'UTM Campaign', 'quillcrm' ),
			),
			'utm_term'     => array(
				'type'  => 'text',
				'label' => __( 'UTM Term', 'quillcrm' ),
			),
		);
	}
}

Send_Message::instance();
