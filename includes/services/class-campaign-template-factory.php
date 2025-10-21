<?php
/**
 * Campaign Template Factory
 * Factory pattern for creating and updating campaign templates
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Services;

use QuillCRM\Models\Template_Model;
use QuillCRM\Services\Template_Field_Mapper;
use QuillCRM\Constants\Campaign_Channel;

/**
 * Campaign_Template_Factory class
 */
class Campaign_Template_Factory {

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Campaign_Template_Factory
	 */
	private static $instance;

	/**
	 * Campaign_Template_Factory Instance.
	 *
	 * Instantiates or reuses an instance of Campaign_Template_Factory.
	 *
	 * @since  1.0.0
	 * @static
	 *
	 * @return self - Single instance
	 */
	public static function instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Process templates data and create/update Template_Model records
	 *
	 * @param array  $templates_data Array of template data
	 * @param string $campaign_type Campaign type (email, sms, whatsapp)
	 * @param string $campaign_status Campaign status (draft, scheduled, etc.)
	 * @return array Array of template IDs
	 */
	public function process_templates_data( $templates_data, $campaign_type, $campaign_status = 'draft' ) {
		if ( empty( $templates_data ) || ! is_array( $templates_data ) ) {
			quillcrm_get_logger()->warning(
				'Template processing: Empty or invalid templates_data',
				array(
					'templates_data' => $templates_data,
					'campaign_type'  => $campaign_type,
					'code'           => 'template_processing_empty_data',
				)
			);
			return array();
		}

		$template_ids = array();

		foreach ( $templates_data as $index => $template_data ) {
			quillcrm_get_logger()->info(
				'Processing template',
				array(
					'index'           => $index,
					'template_data'   => $template_data,
					'campaign_type'   => $campaign_type,
					'campaign_status' => $campaign_status,
					'code'            => 'template_processing_start',
				)
			);

			$template_processor = $this->get_template_processor( $campaign_type );
			$template           = $template_processor->process( $template_data, $campaign_status );

			if ( $template ) {
				$template_ids[] = $template->id;
				quillcrm_get_logger()->info(
					'Template processed successfully',
					array(
						'template_id' => $template->id,
						'code'        => 'template_processing_success',
					)
				);
			} else {
				quillcrm_get_logger()->error(
					'Template processing failed',
					array(
						'template_data' => $template_data,
						'campaign_type' => $campaign_type,
						'code'          => 'template_processing_failed',
					)
				);
			}
		}

		return $template_ids;
	}

	/**
	 * Get template processor for campaign type
	 *
	 * @param string $campaign_type Campaign type
	 * @return Template_Processor_Interface
	 * @throws \InvalidArgumentException
	 */
	private function get_template_processor( $campaign_type ) {
		switch ( $campaign_type ) {
			case Campaign_Channel::STR_EMAIL:
			case Campaign_Channel::STR_EMAIL_SEQUENCE:
			case Campaign_Channel::STR_SEQUENCE_MAIL:
				return new Email_Template_Processor();
			case Campaign_Channel::STR_SMS:
				return new SMS_Template_Processor();
			case Campaign_Channel::STR_WHATSAPP:
				return new WhatsApp_Template_Processor();
			default:
				throw new \InvalidArgumentException( "Unsupported campaign type: {$campaign_type}" );
		}
	}
}

/**
 * Template Processor Interface
 */
interface Template_Processor_Interface {

	/**
	 * Process template data and create/update template
	 *
	 * @param array  $template_data Template data
	 * @param string $campaign_status Campaign status (draft, scheduled, etc.)
	 * @return Template_Model|null
	 */
	public function process( array $template_data, $campaign_status = 'draft' );

	/**
	 * Get default template name
	 *
	 * @return string
	 */
	public function get_default_name();

	/**
	 * Validate template data
	 *
	 * @param array $template_data Template data
	 * @return bool
	 */
	public function validate( array $template_data);
}

/**
 * Abstract Template Processor
 */
abstract class Abstract_Template_Processor implements Template_Processor_Interface {

	/**
	 * Campaign type
	 *
	 * @var string
	 */
	protected $campaign_type;

	/**
	 * Constructor
	 *
	 * @param string $campaign_type Campaign type (email, sms, whatsapp)
	 */
	public function __construct( $campaign_type ) {
		$this->campaign_type = $campaign_type;
	}

	/**
	 * Process template data
	 *
	 * @param array  $template_data Template data
	 * @param string $campaign_status Campaign status (draft, scheduled, etc.)
	 * @return Template_Model|null
	 */
	public function process( array $template_data, $campaign_status = 'draft' ) {
		if ( ! $this->validate( $template_data ) ) {
			return null;
		}

		$template_id = $template_data['template_id'] ?? null;
		$hidden      = $template_data['hidden'] ?? 1;

		// If campaign is NOT draft, create new template to preserve original
		// Only update existing template if campaign is draft
		if ( $campaign_status !== 'draft' ) {
			$template_id = null; // Force creation of new template
		}

		$processed_data = $this->process_specific_data( $template_data );

		$template_attributes = array(
			'name'     => $processed_data['name'] ?: $this->get_default_name(),
			'type'     => $this->campaign_type,
			'subject'  => $processed_data['subject'] ?? '',
			'body'     => $processed_data['body'] ?? $this->get_default_body(),
			'settings' => $processed_data['settings'] ?? array(),
			'hidden'   => $hidden,
		);

		return Template_Model::createOrUpdate( $template_id, $template_attributes );
	}

	/**
	 * Process campaign-specific template data
	 * Uses centralized Template_Field_Mapper for consistent field mapping
	 *
	 * @param array $template_data Template data
	 * @return array Processed data with name, subject, body, settings
	 */
	protected function process_specific_data( array $template_data ) {
		// Use centralized field mapper
		$processed = Template_Field_Mapper::array_to_template( $template_data, $this->campaign_type );

		// Apply defaults if needed
		if ( empty( $processed['body'] ) ) {
			$processed['body'] = $this->get_default_body();
		}

		return $processed;
	}

	/**
	 * Get default template body
	 * Must be implemented by child classes
	 *
	 * @return string
	 */
	abstract protected function get_default_body();

	/**
	 * Basic validation - can be overridden by child classes
	 *
	 * @param array $template_data Template data
	 * @return bool
	 */
	public function validate( array $template_data ) {
		if ( empty( $template_data ) ) {
			quillcrm_get_logger()->error(
				'Template validation failed: Empty template data',
				array(
					'campaign_type' => $this->campaign_type,
					'code'          => 'template_validation_empty',
				)
			);
			return false;
		}

		// For SMS and WhatsApp, validate body content and length
		if ( in_array( $this->campaign_type, array( Campaign_Channel::STR_SMS, Campaign_Channel::STR_WHATSAPP ) ) ) {
			$body = $template_data['body'] ?? '';

			// Body is required
			if ( empty( trim( $body ) ) ) {
				quillcrm_get_logger()->error(
					'Template validation failed: Empty body',
					array(
						'campaign_type' => $this->campaign_type,
						'template_data' => $template_data,
						'code'          => 'template_validation_empty_body',
					)
				);
				return false;
			}

			// Validate body length (max 1600 characters)
			if ( strlen( wp_strip_all_tags( $body ) ) > 1600 ) {
				quillcrm_get_logger()->error(
					'Template validation failed: Body too long',
					array(
						'campaign_type' => $this->campaign_type,
						'body_length'   => strlen( wp_strip_all_tags( $body ) ),
						'code'          => 'template_validation_body_too_long',
					)
				);
				return false;
			}
		}

		return true;
	}
}

/**
 * Email Template Processor
 */
class Email_Template_Processor extends Abstract_Template_Processor {

	/**
	 * Constructor
	 */
	public function __construct() {
		parent::__construct( Campaign_Channel::STR_EMAIL );
	}

	/**
	 * Get default template name
	 *
	 * @return string
	 */
	public function get_default_name() {
		return __( 'Email Campaign Template', 'quillcrm' );
	}

	/**
	 * Get default email template body
	 *
	 * @return string
	 */
	protected function get_default_body() {
		return '<div><p>Hi {{contact:first_name}} {{contact:last_name}},</p><p>Thank you for subscribing to our updates.</p><p>Don\'t want to stay in the loop? We\'ll be sad to see you go, but you can click here to <a href="{{contact:unsubscribe_link}}" target="_blank">unsubscribe</a>.</p></div>';
	}

	/**
	 * Validate email template data
	 *
	 * @param array $template_data Template data
	 * @return bool
	 */
	public function validate( array $template_data ) {
		// Call parent validation first
		if ( ! parent::validate( $template_data ) ) {
			quillcrm_get_logger()->error(
				'Email template validation failed: Parent validation failed',
				array(
					'template_data' => $template_data,
					'code'          => 'email_template_validation_parent_failed',
				)
			);
			return false;
		}

		// Email templates require both subject and body
		if ( empty( $template_data['subject'] ) ) {
			quillcrm_get_logger()->error(
				'Email template validation failed: Empty subject',
				array(
					'template_data' => $template_data,
					'code'          => 'email_template_validation_empty_subject',
				)
			);
			return false;
		}

		if ( empty( $template_data['body'] ) ) {
			quillcrm_get_logger()->error(
				'Email template validation failed: Empty body',
				array(
					'template_data' => $template_data,
					'code'          => 'email_template_validation_empty_body',
				)
			);
			return false;
		}

		// Validate from_name is present in settings (unified structure)
		if ( empty( $template_data['settings']['from_name'] ) ) {
			quillcrm_get_logger()->error(
				'Email template validation failed: Empty from_name in settings',
				array(
					'template_data' => $template_data,
					'code'          => 'email_template_validation_empty_from_name',
				)
			);
			return false;
		}

		// Validate from_email is present in settings (unified structure)
		if ( empty( $template_data['settings']['from_email'] ) ) {
			quillcrm_get_logger()->error(
				'Email template validation failed: Empty from_email in settings',
				array(
					'template_data' => $template_data,
					'code'          => 'email_template_validation_empty_from_email',
				)
			);
			return false;
		}

		return true;
	}
}

/**
 * SMS Template Processor
 */
class SMS_Template_Processor extends Abstract_Template_Processor {

	/**
	 * Constructor
	 */
	public function __construct() {
		parent::__construct( Campaign_Channel::STR_SMS );
	}

	/**
	 * Get default template name
	 *
	 * @return string
	 */
	public function get_default_name() {
		return __( 'SMS Campaign Template', 'quillcrm' );
	}

	/**
	 * Get default SMS template body
	 *
	 * @return string
	 */
	protected function get_default_body() {
		return 'Hi {{contact:first_name}}, thank you for subscribing! Reply STOP to unsubscribe.';
	}
}

/**
 * WhatsApp Template Processor
 */
class WhatsApp_Template_Processor extends Abstract_Template_Processor {

	/**
	 * Constructor
	 */
	public function __construct() {
		parent::__construct( Campaign_Channel::STR_WHATSAPP );
	}

	/**
	 * Get default template name
	 *
	 * @return string
	 */
	public function get_default_name() {
		return __( 'WhatsApp Campaign Template', 'quillcrm' );
	}

	/**
	 * Get default WhatsApp template body
	 *
	 * @return string
	 */
	protected function get_default_body() {
		return 'Hi {{contact:first_name}}, thank you for subscribing! Reply STOP to unsubscribe.';
	}
}
