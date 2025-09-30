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
		'subject',
		'body',
		'settings',
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
	);

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
		if ($this->type === 'email') {
			$rules['settings.from_email'] = 'email';
		}
		
		return $rules;
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
