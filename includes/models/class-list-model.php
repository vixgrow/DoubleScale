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
use QuillCRM\Models\Contact_Model;

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
		'name.required' => 'List name is required',
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
		return $this->belongsToMany( Contact_Model::class, 'quillcrm_contact_list_relationship', 'list_id', 'contact_id' );
	}

	/**
	 * Get by name
	 *
	 * @param string $name List name
	 *
	 * @return mixed
	 */
	public static function get_by_name( $name ) {
		return static::where( 'name', $name )->first();
	}

	/**
	 * Get or create list
	 *
	 * @param string $name Tag name
	 *
	 * @return mixed
	 */
	public static function getOrCreate( $name ) {
		$list = static::get_by_name( $name );

		if ( ! $list ) {
			$list = static::create( array( 'name' => $name ) );
		}

		return $list;
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
			throw new \Exception( __( 'List name already exists', 'quillcrm' ) );
		}

		return parent::save( $options );
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

		static::saving(
			function ( $list ) {
				if ( isset( $list->contacts_count ) ) {
					unset( $list->contacts_count );
				}
			}
		);

		// When deleting a list, delete all relationships.
		static::deleting(
			function ( $list ) {
				$list->contacts()->detach();
			}
		);

		// Attach contacts count to the list.
		static::retrieved(
			function ( $list ) {
				$list->contacts_count = $list->contacts()->count();
			}
		);
	}
}
