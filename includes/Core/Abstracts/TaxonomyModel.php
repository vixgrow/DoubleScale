<?php

namespace DoubleScale\Core\Abstracts;


defined( 'ABSPATH' ) || exit;

use WPEloquent\Eloquent\Model;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use Illuminate\Support\Str;

class TaxonomyModel extends Model {


	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table;


	/**
	 * Model name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $model_name;

	/**
	 * Model slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $model_slug;
	/**
	 * Primary key
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $primary_key = 'id';

	/**
	 * Hidden from JSON (discriminator for unified table; implied by endpoint).
	 *
	 * @var array
	 */
	protected $hidden = array( 'type' );

	/**
	 * Fillable columns
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	protected $fillable = array(
		'type',
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
		return $this->belongsToMany(
			ContactModel::class,
			'doublescale_contact_taxonomy_relationship',
			'taxonomy_id',
			'contact_id'
		)
			->wherePivot( 'taxonomy_type', $this->model_slug )
			->withPivot( 'taxonomy_type' );
	}

	/**
	 * Discriminator for unified `doublescale_terms.type` (e.g. list, tag).
	 * Always set on insert — do not rely only on model events (may not fire in all stacks).
	 *
	 * @since 1.0.0
	 */
	public static function type_value(): string {
		$instance = new static();
		return $instance->model_slug;
	}

	/**
	 * Get by name
	 *
	 * @param string $name Taxonomy name
	 *
	 * @return mixed
	 */
	public static function get_by_name( $name ) {
		return static::where( 'name', $name )->first();
	}

	/**
	 * Get or create taxonomy
	 *
	 * @param string $name Taxonomy name
	 *
	 * @return mixed
	 */
	public static function getOrCreate( $name ) {
		$taxonomy = static::get_by_name( $name );

		if ( ! $taxonomy ) {
			$taxonomy = static::create( array( 'name' => $name ) );
		}

		return $taxonomy;
	}

	/**
	 * Override the save method to add validation.
	 *
	 * @param array $options
	 * @return bool
	 * @throws \Exception
	 */
	public function save( array $options = array() ) {
		$dispatcher = static::getEventDispatcher();
		$model_name = static::class;
		$event_name = "eloquent.creating: {$model_name}";
		$listeners  = $dispatcher->getListeners( $event_name );

		// If no listeners, re-register events on current dispatcher
		if ( count( $listeners ) === 0 ) {
			$this->registerEventsOnDispatcher( $dispatcher, $model_name );
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
		// Creating event — always set `type` first (unified `doublescale_terms` table).
		$dispatcher->listen(
			"eloquent.creating: {$model_name}",
			function ( $taxonomy ) {
				$class = get_class( $taxonomy );
				if ( is_subclass_of( $class, TaxonomyModel::class, true ) ) {
					$taxonomy->setAttribute( 'type', $class::type_value() );
				}
				$originalSlug = $slug = Str::slug( $taxonomy->name );
				$count        = 1;

				while ( static::where( 'slug', $slug )->exists() ) {
					$slug = $originalSlug . '-' . $count++;
				}

				$taxonomy->slug = $slug;
			}
		);

		// Saving event
		$dispatcher->listen(
			"eloquent.saving: {$model_name}",
			function ( $taxonomy ) {
				unset( $taxonomy->contacts_count );
			}
		);

		// Deleting event
		$dispatcher->listen(
			"eloquent.deleting: {$model_name}",
			function ( $taxonomy ) {
				$taxonomy->contacts()->detach();
			}
		);

		// Retrieved event - always calculate contacts_count
		// Count distinct contacts in the relationship to ensure accuracy
		$dispatcher->listen(
			"eloquent.retrieved: {$model_name}",
			function ( $taxonomy ) {
				$taxonomy->contacts_count = $taxonomy->contacts()->distinct()->count();
			}
		);
	}

	/**
	 * Automatically add slug when creating a taxonomy using the name and boot method
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
