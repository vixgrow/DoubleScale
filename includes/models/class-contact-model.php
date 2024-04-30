<?php
/**
 * Class Contact_Model
 * This class is responsible for handling the contact model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use QuillCRM\Models\Model;
use QuillCRM\Models\List_Model;
use QuillCRM\Models\Tag_Model;
use QuillCRM\Models\Custom_Field_Model;
use QuillCRM\Models\Contact_Note_Model;
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Contact_Model class
 */
class Contact_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_contacts';

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
		'email',
		'first_name',
		'last_name',
		'phone',
		'address_1',
		'address_2',
		'city',
		'state',
		'country',
		'zip',
		'source',
		'status',
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
	 * Get the contact lists
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
	 */
	public function lists() {
		return $this->belongsToMany( List_Model::class, 'quillcrm_contact_list_relationship', 'contact_id', 'list_id' );
	}

	/**
	 * Get the contact tags
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
	 */
	public function tags() {
		return $this->belongsToMany( Tag_Model::class, 'quillcrm_contact_tag_relationship', 'contact_id', 'tag_id' );
	}

	/**
	 * Get the custom fields
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
	 */
	public function custom_fields() {
		return $this->belongsToMany( Custom_Field_Model::class, 'quillcrm_contact_custom_field_relationship', 'contact_id', 'custom_field_id' )->withPivot( 'value' );
	}

	/**
	 * Get the contact notes
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function notes() {
		return $this->hasMany( Contact_Note_Model::class, 'contact_id', 'id' );
	}

	/**
	 * Get the contact automations
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function automation_contacts() {
		return $this->hasMany( Automation_Contact_Model::class, 'contact_id', 'id' );
	}

	/**
	 * Get contact processes
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function processes() {
		return $this->hasMany( Automation_Contact_Process_Model::class, 'contact_id', 'id' );
	}

	/**
	 * Override the save method to add validation.
	 *
	 * @param array $options
	 * @return bool
	 * @throws \Exception
	 */
	public function save( array $options = array() ) {
		// Check if the email field is empty
		if ( empty( $this->email ) ) {
			throw new \Exception( 'Email field is required.' );
		}

		// Call the parent save method to perform the actual saving
		return parent::save( $options );
	}

	/**
	 * Get automation data
	 *
	 * @since 1.0.0
	 *
	 * @return Automation_Model
	 */
	public function automation() {
		return $this->automation_contact->automation;
	}

	/**
	 * Delete the contact notes boot method
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function boot() {
		parent::boot();

		static::deleting(
			function( $contact ) {
				$contact->notes()->delete();

				// Delete the contact from the automation contacts
				$contact->automation_contacts()->delete();
			}
		);
	}
}
