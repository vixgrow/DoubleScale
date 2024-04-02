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
}
