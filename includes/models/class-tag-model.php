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
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array(
		'name' => 'required',
	);

	/**
	 * Messages
	 *
	 * @var array
	 */
	protected $messages = array(
		'name.required' => 'Tag name is required',
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
	 * Get by name
	 *
	 * @param string $name Tag name
	 *
	 * @return mixed
	 */
	public static function get_by_name( $name ) {
		return static::where( 'name', $name )->first();
	}

	/**
	 * Get or create tag
	 *
	 * @param string $name Tag name
	 *
	 * @return mixed
	 */
	public static function getOrCreate( $name ) {
		$tag = static::get_by_name( $name );

		if ( ! $tag ) {
			$tag = static::create( array( 'name' => $name ) );
		}

		return $tag;
	}

	/**
	 * Override the save method to add validation.
	 *
	 * @param array $options
	 * @return bool
	 * @throws \Exception
	 */
	public function save( array $options = array() ) {
		$search = static::get_by_name( $this->name );

		if ( $search && $search->id !== $this->id ) {
			throw new \Exception( __( 'Tag name already exists', 'quillcrm' ) );
		}

		return parent::save( $options );
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

		static::saving(
			function ( $tag ) {
				if ( isset( $tag->contacts_count ) ) {
					unset( $tag->contacts_count );
				}
			}
		);

		// Delete the relationship when deleting the tag
		static::deleting(
			function ( $tag ) {
				$tag->contacts()->detach();
			}
		);

		// Attach contacts count to the tag.
		static::retrieved(
			function ( $tag ) {
				$tag->contacts_count = $tag->contacts()->count();
			}
		);
	}
}
