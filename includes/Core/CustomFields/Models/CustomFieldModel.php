<?php
/**
 * Custom field definition model (contact-scoped fields and merge tags).
 *
 * @package DoubleScale\Core\CustomFields\Models
 */

namespace DoubleScale\Core\CustomFields\Models;

use Illuminate\Support\Str;
use WPEloquent\Eloquent\Model;
use DoubleScale\Modules\Contacts\Models\ContactModel;

/**
 * CustomFieldModel class
 */
class CustomFieldModel extends Model {

	/**
	 * Table name.
	 *
	 * @var string
	 */
	protected $table = 'doublescale_custom_fields';

	/**
	 * Primary key.
	 *
	 * @var string
	 */
	protected $primary_key = 'id';

	/**
	 * Fillable columns.
	 *
	 * @var array
	 */
	protected $fillable = array(
		'name',
		'slug',
		'type',
		'attributes',
		'group_id',
		'scope',
		'created_at',
		'updated_at',
	);

	/**
	 * Casts.
	 *
	 * @var array
	 */
	protected $casts = array(
		'attributes' => 'array',
		'group_id'   => 'integer',
		'scope'      => 'string',
	);

	/**
	 * Rules.
	 *
	 * @var array
	 */
	protected $rules = array(
		'name'     => 'required',
		'type'     => 'required',
		'group_id' => 'required',
		'scope'    => 'required',
	);

	/**
	 * Validation messages.
	 *
	 * @var array
	 */
	protected $messages = array(
		'name.required'     => 'Custom field name is required',
		'type.required'     => 'Custom field type is required',
		'group_id.required' => 'Custom field group ID is required',
		'scope.required'    => 'Custom field scope is required',
	);

	/**
	 * Timestamps.
	 *
	 * @var bool
	 */
	public $timestamps = true;

	/**
	 * Group relation.
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function group() {
		return $this->belongsTo( CustomFieldsGroupModel::class, 'group_id' );
	}

	/**
	 * Contacts using this field (pivot: entity_id + entity_type).
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
	 */
	public function contacts() {
		return $this->belongsToMany(
			ContactModel::class,
			'doublescale_custom_field_relationship',
			'custom_field_id',
			'entity_id'
		)->wherePivot( 'entity_type', 'contact' );
	}

	/**
	 * Validate a value for this field type.
	 *
	 * @param mixed $value Value to validate.
	 * @return bool
	 */
	public function validate_value( $value ) {
		switch ( $this->type ) {
			case 'boolean':
			case 'checkbox':
				return ( $value === 'false' || $value === 'true' || $value === false || $value === true );
			case 'text':
			case 'textarea':
				return is_string( $value );
			case 'number':
				return is_numeric( $value );
			case 'date':
				return (bool) strtotime( (string) $value );
			case 'email':
				return (bool) is_email( (string) $value );
			case 'phone':
				return (bool) preg_match( '/^[0-9\-\(\)\/\+\s]*$/', (string) $value );
			case 'url':
				return (bool) filter_var( $value, FILTER_VALIDATE_URL );
			case 'select':
				$attributes = $this['attributes'];
				return in_array( $value, $attributes, true );
			case 'multiselect':
				$values     = is_array( $value ) ? $value : explode( ',', (string) $value );
				$attributes = $this['attributes'];
				foreach ( $values as $val ) {
					if ( ! in_array( $val, $attributes, true ) ) {
						return false;
					}
				}
				return true;
			default:
				return true;
		}
	}

	/**
	 * Resolve field id from slug (used by merge tags: contact_field:slug).
	 *
	 * @param string $key Field slug.
	 * @return int
	 */
	public static function get_id( $key ) {
		$field = static::where( 'slug', $key )->first();
		return $field ? (int) $field->id : 0;
	}

	/**
	 * Boot model events.
	 */
	public static function boot() {
		parent::boot();

		static::creating(
			function ( $field ) {
				if ( empty( $field->slug ) ) {
					$field->slug = Str::slug( $field->name );
				}

				if ( static::where( 'slug', $field->slug )->exists() ) {
					throw new \Exception( sprintf( __( '%s already exists.', 'doublescale' ), $field->name ) );
				}

				if ( ! CustomFieldsGroupModel::find( $field->group_id ) && (int) $field->group_id !== 0 ) {
					throw new \Exception( sprintf( __( 'Group with ID %s does not exist.', 'doublescale' ), $field->group_id ) );
				}
			}
		);

		static::deleting(
			function ( $field ) {
				$field->contacts()->detach();
			}
		);
	}
}
