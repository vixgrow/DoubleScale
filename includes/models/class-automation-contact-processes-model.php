<?php
/**
 * Class Automation_Contact_Processes_Model
 * This class is responsible for handling the Automation_Contact_Processes_Model model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use QuillCRM\Models\Model;

/**
 * Automation_Contact_Processes_Model class
 */
class Automation_Contact_Processes_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_automation_contact_processes';

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
		'step_id',
		'contact_id',
		'automation_id',
		'automation_contact_id',
		'status',
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
	 * Step model
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function step() {
		return $this->belongsTo( 'QuillCRM\Models\Automation_Step_Model', 'step_id', 'id' );
	}

	/**
	 * Contact model
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function contact() {
		return $this->belongsTo( 'QuillCRM\Models\Contact_Model', 'contact_id', 'id' );
	}

	/**
	 * Automation model
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function automation() {
		return $this->belongsTo( 'QuillCRM\Models\Automation_Model', 'automation_id', 'id' );
	}

	/**
	 * Automation Contacts
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function automation_contact() {
		return $this->belongsTo( 'QuillCRM\Models\Automation_Contact_Model', 'automation_contact_id', 'id' );
	}
}
