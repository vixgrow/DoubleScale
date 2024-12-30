<?php
/**
 * Class Link Trigger Model
 *
 * This class is responsible for handling the link trigger model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;

/**
 * Link Trigger Model class
 */
class Link_Trigger_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_link_triggers';

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
		'hash',
		'status',
		'settings',
		'click_count',
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
		'name.required' => 'Link trigger name is required',
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
	 * Get setting
	 *
	 * @param string $key key.
	 * @param mixed  $default default value.
	 *
	 * @return mixed
	 */
	public function get_setting( $key, $default = null ) {
		return isset( $this->settings[ $key ] ) ? $this->settings[ $key ] : $default;
	}

	/**
	 * Automatically set the slug using the name and boot method
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function boot() {
		parent::boot();

		// Attach full link url to the model when retrieved
		static::retrieved(
			function ( $link_trigger ) {
				$link_trigger->full_url = home_url( '?quillcrm-link-trigger=' . $link_trigger->hash );
			}
		);

		// Unset full link url when saving
		static::saving(
			function ( $link_trigger ) {
				unset( $link_trigger->full_url );
			}
		);
	}
}
