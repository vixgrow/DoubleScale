<?php
/**
 * Class Template_Model
 * This class is responsible for handling the template model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;
use QuillCRM\Constants\Campaign_Channel;

/**
 * Template_Model class
 */
class Template_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_templates';

	/**
	 * Primary key
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $primary_key = 'id';

	/**
	 * Fillable columns
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	protected $fillable = array(
		'name',
		'type',
		'body',
		'settings',
		'hidden',
		'thumbnail',
		'category',
		'is_pro',
		'created_by',
		'created_at',
		'updated_at',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'settings' => 'array',
		// Note: 'type' conversion handled by getTypeAttribute/setTypeAttribute accessors
	);

	/**
	 * Get template type as string for API/frontend
	 *
	 * @param int $value Raw integer value from database
	 * @return string Template type string ('email', 'sms', 'whatsapp')
	 */
	public function getTypeAttribute( $value ) {
		// Convert integer from database to string for API
		return Campaign_Channel::to_string( $value ) ?? 'email';
	}

	/**
	 * Set template type from string to integer for database
	 *
	 * @param string|int $value Template type as string or integer
	 */
	public function setTypeAttribute( $value ) {
		// If it's already an integer, store it directly
		if ( is_int( $value ) ) {
			$this->attributes['type'] = $value;
			return;
		}

		// Convert string to integer for database storage
		$integer_value            = Campaign_Channel::to_integer( $value );
		$this->attributes['type'] = $integer_value ?? Campaign_Channel::CHANNEL_EMAIL;
	}

	/**
	 * Get subject from settings
	 *
	 * @param mixed $value Raw value (kept for compatibility, not used)
	 * @return string Subject from settings
	 */
	public function getSubjectAttribute( $value ) {
		$settings = is_array( $this->settings ) ? $this->settings : json_decode( $this->settings, true );
		return $settings['subject'] ?? '';
	}

	/**
	 * Set subject to settings
	 *
	 * @param string $value Subject value
	 */
	public function setSubjectAttribute( $value ) {
		$settings = is_array( $this->settings ) ? $this->settings : json_decode( $this->settings, true );
		if ( ! is_array( $settings ) ) {
			$settings = array();
		}
		$settings['subject']          = $value;
		$this->attributes['settings'] = $settings;
	}

	/**
	 * Get preview_text from settings
	 *
	 * @param mixed $value Raw value (kept for compatibility, not used)
	 * @return string Preview text from settings
	 */
	public function getPreviewTextAttribute( $value ) {
		$settings = is_array( $this->settings ) ? $this->settings : json_decode( $this->settings, true );
		return $settings['preview_text'] ?? '';
	}

	/**
	 * Set preview_text to settings
	 *
	 * @param string $value Preview text value
	 */
	public function setPreviewTextAttribute( $value ) {
		$settings = is_array( $this->settings ) ? $this->settings : json_decode( $this->settings, true );
		if ( ! is_array( $settings ) ) {
			$settings = array();
		}
		$settings['preview_text']     = $value;
		$this->attributes['settings'] = $settings;
	}

	/**
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'name' => 'required',
	);

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'name.required'             => 'Template name is required',
		'settings.from_email.email' => 'From email is not a valid email',
	);

	/**
	 * Timestamps
	 *
	 * @var bool
	 *
	 * @since 1.0.0
	 */
	public $timestamps = true;

	/**
	 * Get validation rules dynamically based on template type
	 *
	 * @return array
	 */
	public function getRules() {
		$rules = $this->rules;

		// Only validate from_email for email templates
		if ( $this->type === 'email' ) {
			$rules['settings.from_email'] = 'email';
		}

		return $rules;
	}

	/**
	 * Get tracking records that use this template
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function tracking_records() {
		return $this->hasMany( Tracking_Model::class, 'template_id' );
	}

	/**
	 * Get setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Key.
	 * @param mixed  $default Default.
	 *
	 * @return mixed
	 */
	public function get_setting( $key, $default = null ) {
		return $this->settings[ $key ] ?? $default;
	}

	/**
	 * Check if template is used in any tracking record
	 * Shared helper to determine if template can be safely updated or needs new version
	 *
	 * @param int $template_id Template ID
	 * @return bool True if template has been used in any sent message
	 */
	public static function is_used_in_tracking( $template_id ) {
		return Tracking_Model::where( 'template_id', $template_id )->exists();
	}

	/**
	 * Create or update template
	 *
	 * @since 1.0.0
	 *
	 * @param int   $id ID.
	 * @param array $data Data.
	 *
	 * @return Template_Model
	 */
	public static function createOrUpdate( $id, $data ) {
		$template = self::find( $id );

		if ( ! $template ) {
			$template = new self();
		}

		$template->fill( $data );
		$template->save();

		return $template;
	}
}
