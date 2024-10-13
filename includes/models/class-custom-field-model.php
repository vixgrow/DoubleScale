<?php
/**
 * Class Custom_Field_Model
 * This class is responsible for handling the custom field model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use Illuminate\Support\Str;
use QuillCRM\Models\Model;
use QuillCRM\Models\Custom_Fields_Group_Model;

/**
 * Custom_Field_Model class
 */
class Custom_Field_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_custom_fields';

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
		'slug',
		'type',
		'attributes',
		'group_id',
		'created_at',
		'updated_at',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'attributes' => 'array',
		'group_id'   => 'integer',
	);

	/**
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'name'     => 'required',
		'type'     => 'required',
		'group_id' => 'required',
	);

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'name.required'     => 'Custom field name is required',
		'type.required'     => 'Custom field type is required',
		'group_id.required' => 'Custom field group ID is required',
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
	 * Get the custom field group
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function group() {
		return $this->belongsTo( Custom_Fields_Group_Model::class, 'group_id' );
	}

	/**
	 * Get custom field contacts
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
	 */
	public function contacts() {
		return $this->belongsToMany( Contact_Model::class, 'quillcrm_contact_custom_field_relationship', 'custom_field_id', 'contact_id' );
	}

	/**
	 * Validate custom field value
	 *
	 * @since 1.0.0
	 *
	 * @param string $value Custom field value.
	 *
	 * @return bool
	 */
	public function validate_value( $value ) {
		switch ( $this->type ) {
			case 'text':
				return is_string( $value );
			case 'number':
				return is_numeric( $value );
			case 'date':
				return (bool) strtotime( $value );
			case 'email':
				return is_email( $value );
			case 'phone':
				return preg_match( '/^[0-9\-\(\)\/\+\s]*$/', $value );
			case 'url':
				return filter_var( $value, FILTER_VALIDATE_URL );
			case 'select':
				return in_array( $value, $this->attributes );
			case 'multiselect':
				$values = explode( ',', $value );
				foreach ( $values as $val ) {
					if ( ! in_array( $val, $this->attributes ) ) {
						return false;
					}
				}
				return true;
			default:
				return true;
		}
	}

	/**
	 * Get custom field ID by key
	 *
	 * @since 1.0.0
	 *
	 * @param string $key Custom field key.
	 *
	 * @return int
	 */
	public static function get_id( $key ) {
		$field = static::where( 'slug', $key )->first();
		return $field ? $field->id : 0;
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

		static::creating(
			function( $field ) {
				$field->slug = Str::slug( $field->name );

				if ( static::where( 'slug', $field->slug )->exists() ) {
					throw new \Exception( sprintf( __( '%s already exists.', 'quillcrm' ), $field->name ) );
				}

				if ( ! Custom_Fields_Group_Model::find( $field->group_id ) && $field->group_id !== 0 ) {
					throw new \Exception( sprintf( __( 'Group with ID %s does not exist.', 'quillcrm' ), $field->group_id ) );
				}
			}
		);

		// Delete the custom field relationships when the custom field is deleted
		static::deleting(
			function( $field ) {
				$field->contacts()->detach();
			}
		);
	}

}
