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
}
