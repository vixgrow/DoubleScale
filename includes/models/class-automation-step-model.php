<?php
/**
 * Class Automation_Step_Model
 * This class is responsible for handling the Automation Step model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use QuillCRM\Models\Model;

/**
 * Automation_Step_Model class
 */
class Automation_Step_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_automation_steps';

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
		'automation_id',
		'action',
		'type',
		'status',
		'settings',
		'created_at',
		'updated_at',
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
	 * Get the automation
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function automation() {
		return $this->belongsTo( Automation_Model::class, 'automation_id', 'id' );
	}

	/**
	 * Get the contacts
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function contacts() {
		return $this->hasMany( Automation_Contact_Model::class, 'step_id', 'id' );
	}
}
