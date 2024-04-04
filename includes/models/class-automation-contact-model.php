<?php
/**
 * Class Automation_Contact_Model
 * This class is responsible for handling the Automation Contact model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use QuillCRM\Models\Model;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Automation_Step_Model;

/**
 * Automation_Contact_Model class
 */
class Automation_Contact_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_automation_contacts';

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
		'contact_id',
		'automation_id',
		'execution_time',
		'event',
		'status',
		'step_id',
		'data',
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
	 * Automation
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function automation() {
		return $this->belongsTo( Automation_Model::class, 'automation_id' );
	}

	/**
	 * Contact
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function contact() {
		return $this->belongsTo( Contact_Model::class, 'contact_id' );
	}

	/**
	 * Step
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function step() {
		return $this->belongsTo( Automation_Step_Model::class, 'step_id' );
	}
}
