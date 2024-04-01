<?php
/**
 * Class Tag_Model
 * This class is responsible for handling the tag model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use QuillCRM\Models\Model;
use QuillCRM\Models\Contact_Model;
use Illuminate\Support\Str;

/**
 * Tag_Model class
 */
class Tag_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_tags';

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
		return $this->belongsToMany( Contact_Model::class, 'quillcrm_contact_tag_relationship', 'tag_id', 'contact_id' );
	}

	/**
	 * Automatically add slug when creating a tag using the name and boot method
	 *
	 * @since 1.0.0
	 */
	public static function boot() {
		parent::boot();

		static::creating(
			function ( $tag ) {
				$originalSlug = $slug = Str::slug( $tag->name );
				$count        = 1;

				while ( static::where( 'slug', $slug )->exists() ) {
					$slug = $originalSlug . '-' . $count++;
				}

				$tag->slug = $slug;
			}
		);
	}
}
