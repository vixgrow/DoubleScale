<?php
/**
 * Class Automation_Model
 * This class is responsible for handling the Automation model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use QuillCRM\Models\Model;

/**
 * Automation_Model class
 */
class Automation_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_automations';

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
		'trigger',
		'status',
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
	 * Timestamps
	 *
	 * @var bool
	 *
	 * @since 1.0.0
	 */
	public $timestamps = true;

	/**
	 * Contacts
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function contacts() {
		return $this->hasMany( Automation_Contact_Model::class, 'automation_id', 'id' );
	}

	/**
	 * Steps
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function steps() {
		return $this->hasMany( Automation_Step_Model::class, 'automation_id', 'id' );
	}

	/**
	 * Processes
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function processes() {
		return $this->hasMany( Automation_Contact_Processes_Model::class, 'automation_id', 'id' );
	}

	/**
	 * Get all automations by trigger
	 *
	 * @since 1.0.0
	 *
	 * @param string $trigger Trigger name
	 *
	 * @return Automation_Model[]
	 */
	public static function get_automations_by_trigger( $trigger ) {
		return self::where( 'trigger', $trigger )
			->where( 'status', 'active' )
			->get();
	}

	/**
	 * Get automation steps ordered by order
	 *
	 * @since 1.0.0
	 *
	 * @return Automation_Step_Model[]
	 */
	public function get_steps() {
		return $this->steps()
			->orderBy( 'order', 'asc' )
			->get();
	}

	/**
	 * Get first step
	 *
	 * @since 1.0.0
	 *
	 * @return Automation_Step_Model
	 */
	public function get_first_step() {
		return $this->steps()
			->where( 'status', 'active' )
			->orderBy( 'order', 'asc' )
			->first();
	}

	/**
	 * Get last step
	 *
	 * @since 1.0.0
	 *
	 * @return Automation_Step_Model
	 */
	public function get_last_step() {
		return $this->steps()
			->where( 'status', 'active' )
			->orderBy( 'order', 'desc' )
			->first();
	}

	/**
	 * Get step by order
	 *
	 * @since 1.0.0
	 *
	 * @param int $order Step order
	 *
	 * @return Automation_Step_Model
	 */
	public function get_step_by_order( $order ) {
		return $this->steps()
			->where( 'status', 'active' )
			->where( 'order', $order )
			->first();
	}

	/**
	 * Get next step
	 *
	 * @since 1.0.0
	 *
	 * @param int $order Step order
	 *
	 * @return Automation_Step_Model
	 */
	public function get_next_step( $order ) {
		return $this->steps()
			->where( 'status', 'active' )
			->where( 'order', '>', $order )
			->orderBy( 'order', 'asc' )
			->first();
	}

	/**
	 * Get Setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Setting key
	 * @param mixed  $default Default value
	 *
	 * @return mixed
	 */
	public function get_setting( $key, $default = null ) {
		return isset( $this->settings[ $key ] ) ? $this->settings[ $key ] : $default;
	}

	/**
	 * Set Setting
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Setting key
	 * @param mixed  $value Setting value
	 *
	 * @return void
	 */
	public function set_setting( $key, $value ) {
		$settings         = $this->settings;
		$settings[ $key ] = $value;
		$this->settings   = $settings;
	}
}
