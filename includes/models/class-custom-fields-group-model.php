<?php
/**
 * Class Custom_Fields_Group_Model
 * This class is responsible for handling the custom fields group model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use Illuminate\Support\Str;
use QuillCRM\Models\Model;
use QuillCRM\Models\Custom_Field_Model;

/**
 * Custom_Fields_Group_Model class
 */
class Custom_Fields_Group_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_custom_fields_groups';

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
	 * Get custom fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function custom_fields() {
		return $this->has_many( Custom_Field_Model::class, 'group_id' );
	}

	/**
	 * Automatically add slug when creating a group using the name and boot method
	 *
	 * @since 1.0.0
	 */
	public static function boot() {

		parent::boot();

		static::creating(
			function( $group ) {
				$group->slug = Str::slug( $group->name );
			}
		);
	}
}
