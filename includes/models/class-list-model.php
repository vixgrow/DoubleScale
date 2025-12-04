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

use WPEloquent\Eloquent\Model;
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
		if ( ! $this->exists ) {
			$dispatcher = static::getEventDispatcher();
			$model_name = static::class;
			$event_name = "eloquent.creating: {$model_name}";
			$listeners  = $dispatcher->getListeners( $event_name );

			// If no listeners, re-register events on current dispatcher
			if ( count( $listeners ) === 0 ) {
				$this->registerEventsOnDispatcher( $dispatcher, $model_name );
			}
		}

		return parent::save( $options );
	}

	/**
	 * Register events on a specific dispatcher
	 *
	 * @param object $dispatcher Event dispatcher instance
	 * @param string $model_name Model class name
	 * @return void
	 */
	private function registerEventsOnDispatcher( $dispatcher, $model_name ) {
		// Creating event
		$dispatcher->listen(
			"eloquent.creating: {$model_name}",
			function ( $list ) {
				$originalSlug = $slug = Str::slug( $list->name );
				$count        = 1;

				while ( static::where( 'slug', $slug )->exists() ) {
					$slug = $originalSlug . '-' . $count++;
				}

				$list->slug = $slug;
			}
		);

		// Saving event
		$dispatcher->listen(
			"eloquent.saving: {$model_name}",
			function ( $list ) {
				unset( $list->contacts_count );
			}
		);

		// Deleting event
		$dispatcher->listen(
			"eloquent.deleting: {$model_name}",
			function ( $list ) {
				$list->contacts()->detach();
			}
		);

		// Retrieved event (if WooCommerce is active)
		if ( quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ) ) {
			$dispatcher->listen(
				"eloquent.retrieved: {$model_name}",
				function ( $list ) {
					$list->contacts_count = $list->contacts()->count();
				}
			);
		}
	}

	/**
	 * Automatically add slug when creating a list using the name and boot method
	 *
	 * @since 1.0.0
	 */
	public static function boot() {
		 parent::boot();

		// Get the event dispatcher
		$dispatcher = static::getEventDispatcher();
		if ( ! $dispatcher ) {
			return;
		}

		// Register events directly with the dispatcher
		$model_name = static::class;
		$instance   = new static();
		$instance->registerEventsOnDispatcher( $dispatcher, $model_name );
	}
}
