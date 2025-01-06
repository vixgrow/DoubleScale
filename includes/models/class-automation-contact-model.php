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

use WPEloquent\Eloquent\Model;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Processes_Model;

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
		'current_step',
		'next_step',
		'status',
		'data',
		'execution_time',
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
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'data'          => 'array',
		'contact_id'    => 'integer',
		'automation_id' => 'integer',
		'current_step'  => 'integer',
		'next_step'     => 'integer',
	);

	/**
	 * Automation
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function automation() {
		return $this->belongsTo( Automation_Model::class, 'automation_id', 'id' );
	}

	/**
	 * Contact
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function contact() {
		return $this->belongsTo( Contact_Model::class, 'contact_id', 'id' );
	}

	/**
	 * Next step
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function next_step() {
		return $this->belongsTo( Automation_Step_Model::class, 'next_step' );
	}

	/**
	 * Current step
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function current_step() {
		return $this->belongsTo( Automation_Step_Model::class, 'current_step' );
	}

	/**
	 * Processes
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function processes() {
		return $this->hasMany( Automation_Contact_Processes_Model::class, 'automation_contact_id', 'id' );
	}

	/**
	 * Get data
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Key.
	 * @param mixed  $default Default.
	 *
	 * @return mixed
	 */
	public function get_data( $key, $default = null ) {
		return $this->data[ $key ] ?? $default;
	}

	/**
	 * Boot
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function boot() {
		parent::boot();

		// Delete all the contact processes when the contact is deleted
		static::deleting(
			function( $automation_contact ) {
				$automation_contact->processes()->delete();
			}
		);
	}
}
