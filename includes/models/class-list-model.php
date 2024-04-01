<?php
/**
 * Class List_Model
 * This class is responsible for handling the list model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use QuillCRM\Models\Model;
use Illuminate\Support\Str;

/**
 * List_Model class
 */
class List_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_lists';

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
		'description',
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
	 * Get contacts
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
	 */
	public function contacts() {
		return $this->belongsToMany( 'QuillCRM\Models\Contact_Model', 'quillcrm_contact_list_relationship', 'list_id', 'contact_id' );
	}

	/**
	 * Automatically add slug when creating a list using the name and boot method
	 *
	 * @since 1.0.0
	 */
	public static function boot() {
		parent::boot();

		static::creating(
			function ( $list ) {
				$originalSlug = $slug = Str::slug( $list->name );
				$count        = 1;

				while ( static::where( 'slug', $slug )->exists() ) {
					$slug = $originalSlug . '-' . $count++;
				}

				$list->slug = $slug;
			}
		);
	}
}
