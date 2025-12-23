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

use WPEloquent\Eloquent\Model;
use QuillCRM\Models\List_Model;
use QuillCRM\Models\Tag_Model;
use QuillCRM\Models\Activity_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\User_Model;
use QuillCRM\Models\Communication_Tracking_Model;
use QuillCRM\Models\WC_Order_Model;
use QuillCRM\Models\Automation_Contact_Processes_Model;
use QuillCRM\Models\Contact_Unsubscribe_Model;
// use QuillCRM\Models\Deal_Model; // Moved to Pro
// use QuillCRM\Models\Custom_Field_Model; // Moved to Pro
use QuillCRM\Utils;

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
		'hash_id',
		'email',
		'first_name',
		'last_name',
		'phone',
		'whatsapp_phone',
		'address_1',
		'address_2',
		'city',
		'state',
		'country',
		'zip',
		'source',
		'email_status',
		'sms_status',
		'whatsapp_status',
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
	 * The accessors to append to the model's array form.
	 *
	 * @var array
	 */
	protected $appends = array( 'avatar_url' );

	/**
	 * Tracking context for merge tags
	 * When set, merge tags will use stored values from communication_tracking_meta
	 *
	 * @var int|null
	 */
	protected $tracking_context_id = null;

	/**
	 * Rules
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public $rules = array(
		'email'          => 'required|email',
		'phone'          => 'nullable|regex:/^\+?[0-9]+$/',
		'whatsapp_phone' => 'nullable|regex:/^\+[0-9]{1,15}$/',
		'zip'            => 'nullable|numeric',
	);

	/**
	 * Messages
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public $messages = array(
		'email.required'        => 'Contact email field is required.',
		'email.email'           => 'Invalid email address.',
		'phone.regex'           => 'Invalid phone number.',
		'whatsapp_phone.regex'  => 'Invalid WhatsApp phone number. Must be in E.164 format (e.g., +12025551234).',
		'zip.numeric'           => 'Invalid zip code.',
	);

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
	 * Custom fields are PRO-only feature - uses PRO model if available
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany|null
	 */
	public function custom_fields() {
		if ( class_exists( 'QuillCRM_Pro\Models\Custom_Field_Model' ) ) {
			return $this->belongsToMany( \QuillCRM_Pro\Models\Custom_Field_Model::class, 'quillcrm_custom_field_relationship', 'entity_id', 'custom_field_id' )
				->withPivot( 'value' )
				->wherePivot( 'entity_type', 'contact' );
		}
		return null;
	}

	/**
	 * Get the contact user
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function user() {
		return $this->belongsTo( User_Model::class, 'email', 'user_email' );
	}

	/**
	 * Get the contact campaign emails
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
	 */
	public function campaign_emails() {
		 return $this->hasMany( Communication_Tracking_Model::class, 'contact_id', 'id' )->emails();
	}

	/**
	 * Get the contact orders
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function orders() {
		return $this->hasMany( WC_Order_Model::class, 'billing_email', 'email' );
	}

	/**
	 * Get edd orders
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function edd_orders() {
		return $this->hasMany( EDD_Order_Model::class, 'email', 'email' );
	}

	/**
	 * Get the contact custom field value
	 * Custom fields are PRO-only feature
	 *
	 * @since 1.0.0
	 *
	 * @param int $custom_field_id Custom field ID
	 *
	 * @return string|null
	 */
	public function get_custom_field( $custom_field_id ) {
		if ( ! class_exists( 'QuillCRM_Pro\Models\Custom_Field_Model' ) ) {
			return null;
		}

		$custom_field = $this->custom_fields->where( 'id', $custom_field_id )->first();
		if ( $custom_field ) {
			return $custom_field->pivot->value ?? '';
		}

		return null;
	}

	/**
	 * Get the contact notes (from activities table)
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function notes() {
		return $this->hasMany( Activity_Model::class, 'contact_id', 'id' )->where( 'activity_type', 'note' );
	}

	/**
	 * Get unsubscribes
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function unsubscribes() {
		return $this->hasMany( Contact_Unsubscribe_Model::class, 'contact_id', 'id' );
	}

	/**
	 * Get notes attribute - transforms activity models to note format for serialization
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function getNotesAttribute() {
		// Check if notes relationship is loaded
		if ( ! $this->relationLoaded( 'notes' ) ) {
			return array();
		}

		// Transform activities to note format
		return $this->getRelation( 'notes' )->map(
			function ( $activity ) {
				return $activity->to_note_format();
			}
		)->values()->toArray();
	}

	/**
	 * Get the contact automations
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function automation_contacts() {
		 return $this->hasMany( Automation_Contact_Model::class, 'contact_id', 'id' );
	}

	/**
	 * Get contact processes
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function processes() {
		return $this->hasMany( Automation_Contact_Processes_Model::class, 'contact_id', 'id' );
	}

	/**
	 * Get the deals for this contact
	 * Deals are PRO-only feature - uses PRO model if available
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany|null
	 */
	public function deals() {
		if ( class_exists( 'QuillCRM_Pro\Models\Deal_Model' ) ) {
			return $this->hasMany( \QuillCRM_Pro\Models\Deal_Model::class, 'contact_id', 'id' );
		}
		return null;
	}

	/**
	 * Get active deals (open status) for this contact
	 * Deals are PRO-only feature - uses PRO model if available
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany|null
	 */
	public function active_deals() {
		if ( class_exists( 'QuillCRM_Pro\Models\Deal_Model' ) ) {
			return $this->hasMany( \QuillCRM_Pro\Models\Deal_Model::class, 'contact_id', 'id' )->where( 'status', 'open' );
		}
		return null;
	}

	/**
	 * Get total deal value for won deals
	 * Returns 0 if Pro plugin is not active
	 *
	 * @since 1.0.0
	 *
	 * @return float
	 */
	public function getTotalDealValueAttribute() {
		$deals = $this->deals();
		if ( ! $deals ) {
			return 0;
		}
		return $deals->where( 'status', 'won' )->sum( 'value' );
	}

	/**
	 * Get active deals count
	 * Returns 0 if Pro plugin is not active
	 *
	 * @since 1.0.0
	 *
	 * @return int
	 */
	public function getActiveDealsCountAttribute() {
		$active_deals = $this->active_deals();
		if ( ! $active_deals ) {
			return 0;
		}
		return $active_deals->count();
	}

	/**
	 * Get avatar URL using WordPress get_avatar_url()
	 *
	 * @since 1.0.0
	 *
	 * @return string
	 */
	public function getAvatarUrlAttribute() {
		$email = $this->email;
		$size  = 96; // Default avatar size

		// Get the user ID if this email belongs to a WordPress user
		$user    = get_user_by( 'email', $email );
		$user_id = $user ? $user->ID : 0;

		// Use get_avatar_url() with email and size
		// If user_id is 0, it will use the email for Gravatar
		$avatar_url = get_avatar_url( $user_id ? $user_id : $email, array( 'size' => $size ) );

		return $avatar_url;
	}

	/**
	 * Get automation data
	 *
	 * @since 1.0.0
	 *
	 * @return Automation_Model
	 */
	public function automation() {
		return $this->automation_contact->automation;
	}

	/**
	 * Get contact by email
	 *
	 * @since 1.0.0
	 *
	 * @param string $email Contact email
	 *
	 * @return Contact_Model
	 */
	public static function get_by_email( $email ) {
		return self::where( 'email', $email )->first();
	}

	/**
	 * Get contact by hash ID
	 *
	 * @since 1.0.0
	 *
	 * @param string $hash_id Contact hash ID
	 *
	 * @return Contact_Model
	 */
	public static function get_by_hash_id( $hash_id ) {
		return self::where( 'hash_id', $hash_id )->first();
	}

	/**
	 * Check if contact is subscribed to a specific channel
	 *
	 * @since 1.1.0
	 *
	 * @param string $channel Channel name (email, sms, whatsapp)
	 * @return bool True if subscribed
	 */
	public function is_subscribed_to_channel( $channel ) {
		// Validate channel
		if ( ! in_array( $channel, self::get_valid_channels(), true ) ) {
			return false;
		}

		// Check channel-specific status
		$status_field = $channel . '_status';
		$status_value = $this->getAttribute( $status_field );

		// Handle NULL gracefully (shouldn't happen with NOT NULL constraint, but defensive)
		if ( is_null( $status_value ) ) {
			return true; // Default to subscribed
		}

		// All channels: 'blocked', 'unsubscribed' = not subscribed
		$excluded_statuses = array( 'blocked', 'unsubscribed' );

		// Email-only statuses: 'bounced', 'unverified'
		if ( 'email' === $channel ) {
			$excluded_statuses[] = 'bounced';
			$excluded_statuses[] = 'unverified';
		}

		if ( in_array( $status_value, $excluded_statuses, true ) ) {
			return false;
		}

		return 'subscribed' === $status_value;
	}

	/**
	 * Unsubscribe from specific mode
	 *
	 * @since 1.1.0
	 *
	 * @param int      $mode        Mode integer (1=Email, 2=SMS, 3=WhatsApp)
	 * @param string   $reason      Optional reason
	 * @param int|null $source_type Source type integer (1=Campaign, 2=Automation)
	 * @param int|null $source_id   Campaign ID or Automation ID
	 * @return bool Success
	 */
	public function unsubscribe_from_mode( $mode, $reason = '', $source_type = null, $source_id = null ) {
		// Map mode to channel for status field
		$channel_map = array(
			1 => 'email',
			2 => 'sms',
			3 => 'whatsapp',
		);
		
		if ( ! isset( $channel_map[ $mode ] ) ) {
			return false;
		}
		
		$channel = $channel_map[ $mode ];
		$status_field = $channel . '_status';

		// Check if already unsubscribed
		if ( 'unsubscribed' === $this->getAttribute( $status_field ) ) {
			return true;
		}

		// Update status
		$this->$status_field = 'unsubscribed';
		$this->save();

		// Record unsubscribe in dedicated table
		try {
			Contact_Unsubscribe_Model::record_unsubscribe(
				$this->id,
				$mode,
				$reason,
				$source_type,
				$source_id
			);
		} catch ( \Exception $e ) {
			if ( function_exists( 'quillcrm_get_logger' ) ) {
				quillcrm_get_logger()->error(
					'Failed to record unsubscribe',
					array(
						'contact_id'  => $this->id,
						'mode'        => $mode,
						'error'       => $e->getMessage(),
						'source_type' => $source_type,
						'source_id'   => $source_id,
					)
				);
			}
		}

		// Create system note (dual-write for backward compatibility)
		$channel_label = self::get_channel_label( $channel );
		$note_text     = sprintf( __( 'Contact unsubscribed from %s.', 'quillcrm' ), $channel_label );

		if ( ! empty( $reason ) ) {
			$note_text .= ' ' . sprintf( __( 'Reason: %s', 'quillcrm' ), $reason );
		}

		Activity_Model::create(
			array(
				'contact_id'    => $this->id,
				'activity_type' => 'note',
				'data'          => array(
					'title' => __( 'Unsubscribed', 'quillcrm' ),
					'type'  => 'system',
					'note'  => $note_text,
				),
				'user_id'       => get_current_user_id() ?: null,
			)
		);

		// Fire action
		do_action( "quillcrm_{$channel}_unsubscribed", $this );

		return true;
	}

	/**
	 * Subscribe to specific channel
	 *
	 * @since 1.1.0
	 *
	 * @param string $channel Channel name (email, sms, whatsapp)
	 * @return bool Success
	 */
	public function subscribe_to_channel( $channel ) {
		// Validate channel
		if ( ! in_array( $channel, self::get_valid_channels(), true ) ) {
			return false;
		}

		$status_field = $channel . '_status';

		// Check if already subscribed
		if ( 'subscribed' === $this->getAttribute( $status_field ) ) {
			return true; // Already subscribed
		}

		// Update channel status
		$this->$status_field = 'subscribed';

		// Save changes
		$this->save();

		// Create system note
		$channel_label = self::get_channel_label( $channel );

		Activity_Model::create(
			array(
				'contact_id'    => $this->id,
				'activity_type' => 'note',
				'data'          => array(
					'title' => __( 'Subscribed', 'quillcrm' ),
					'type'  => 'system',
					'note'  => sprintf( __( 'Contact subscribed to %s.', 'quillcrm' ), $channel_label ),
				),
				'user_id'       => get_current_user_id() ?: null,
			)
		);

		// Fire channel-specific action
		do_action( "quillcrm_{$channel}_subscribed", $this );

		return true;
	}

	/**
	 * Get channel subscription statuses
	 *
	 * @since 1.1.0
	 *
	 * @return array Channel statuses
	 */
	public function get_channel_subscriptions() {
		return array(
			'email'    => $this->getAttribute( 'email_status' ),
			'sms'      => $this->getAttribute( 'sms_status' ),
			'whatsapp' => $this->getAttribute( 'whatsapp_status' ),
		);
	}

	/**
	 * Get localized channel label
	 *
	 * @since 1.1.0
	 *
	 * @param string $channel Channel name (email, sms, whatsapp).
	 * @return string Localized channel label
	 */
	public static function get_channel_label( $channel ) {
		$labels = array(
			'email'    => __( 'emails', 'quillcrm' ),
			'sms'      => __( 'SMS messages', 'quillcrm' ),
			'whatsapp' => __( 'WhatsApp messages', 'quillcrm' ),
		);

		return $labels[ $channel ] ?? __( 'communications', 'quillcrm' );
	}

	/**
	 * Get list of valid channels
	 *
	 * @since 1.1.0
	 *
	 * @return array Valid channel identifiers
	 */
	public static function get_valid_channels() {
		return array( 'email', 'sms', 'whatsapp' );
	}

	/**
	 * Sync lists
	 *
	 * @since 1.0.0
	 *
	 * @param array $lists List IDs
	 *
	 * @return void
	 */
	public function sync_lists( $lists ) {
		$existing_lists  = $this->lists->pluck( 'id' )->toArray();
		$lists_to_add    = array_diff( $lists, $existing_lists );
		$lists_to_remove = array_diff( $existing_lists, $lists );

		if ( ! empty( $lists_to_add ) ) {
			$this->lists()->attach( $lists_to_add );
			do_action( 'quillcrm_contact_lists_applied', $this, $lists_to_add );
		}

		if ( ! empty( $lists_to_remove ) ) {
			$this->lists()->detach( $lists_to_remove );
			do_action( 'quillcrm_contact_lists_removed', $this, $lists_to_remove );
		}
	}

	/**
	 * Sync tags
	 *
	 * @since 1.0.0
	 *
	 * @param array $tags Tag IDs
	 *
	 * @return void
	 */
	public function sync_tags( $tags ) {
		$existing_tags  = $this->tags->pluck( 'id' )->toArray();
		$tags_to_add    = array_diff( $tags, $existing_tags );
		$tags_to_remove = array_diff( $existing_tags, $tags );

		if ( ! empty( $tags_to_add ) ) {
			$this->tags()->attach( $tags_to_add );
			do_action( 'quillcrm_contact_tags_applied', $this, $tags_to_add );
		}

		if ( ! empty( $tags_to_remove ) ) {
			$this->tags()->detach( $tags_to_remove );
			do_action( 'quillcrm_contact_tags_removed', $this, $tags_to_remove );
		}
	}

	/**
	 * Override save method to ensure events are registered
	 *
	 * @param array $options
	 * @return bool
	 */
	public function save( array $options = array() ) {
		// Ensure events are registered if this is a new contact
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
	 * Override create method to ensure events are properly registered
	 *
	 * @param array $attributes
	 * @return static
	 */
	public static function create( array $attributes = array() ) {
		// Ensure boot is called by creating a temporary instance
		new static();

		// Create the actual instance using standard Eloquent approach
		$instance = new static();
		$instance->fill( $attributes );
		$instance->save();

		return $instance;
	}

	/**
	 * Create or update contact
	 *
	 * @param array $data Contact data
	 *
	 * @return Contact_Model
	 */
	public static function createOrUpdate( $data ) {
		$contact = self::where( 'email', $data['email'] ?? '' )->first();

		if ( ! $contact ) {
			// Use create() to ensure events fire
			return self::create( $data );
		}

		// For updates, use fill + save to trigger saved event
		$contact->fill( $data );
		$contact->save();

		return $contact;
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
			function ( $contact ) {
				$contact->hash_id = Utils::generate_hash_key();
			}
		);

		// Saving event
		$dispatcher->listen(
			"eloquent.saving: {$model_name}",
			function ( $contact ) {
				unset( $contact->revenue );
			}
		);

		// Saved event
		$dispatcher->listen(
			"eloquent.saved: {$model_name}",
			function ( $contact ) {
				if ( $contact->email_status === 'unsubscribed' ) {
					do_action( 'quillcrm_contact_unsubscribed', $contact );
				} else {
					do_action( 'quillcrm_contact_subscribed', $contact );
				}
			}
		);

		// Deleting event
		$dispatcher->listen(
			"eloquent.deleting: {$model_name}",
			function ( $contact ) {
				// Delete note activities for this contact
				Activity_Model::where( 'contact_id', $contact->id )
					->where( 'activity_type', 'note' )
					->delete();
				$contact->automation_contacts()->delete();
			}
		);

		// Retrieved event (if WooCommerce is active)
		if ( quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ) ) {
			$dispatcher->listen(
				"eloquent.retrieved: {$model_name}",
				function ( $contact ) {
					$orders  = $contact->orders;
					$revenue = 0;

					foreach ( $orders as $order ) {
						$revenue += $order->total_amount;
					}

					$currency         = \get_woocommerce_currency();
					$contact->revenue = $revenue . ' ' . $currency;
				}
			);
		}
	}

	/**
	 * Delete the contact notes boot method
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function boot() {
		// Use global flag to prevent multiple event registrations
		global $quillcrm_contact_events_registered;

		parent::boot();

		if ( $quillcrm_contact_events_registered ) {
			return;
		}
		$quillcrm_contact_events_registered = true;

		// Get the event dispatcher
		$dispatcher = static::getEventDispatcher();
		if ( ! $dispatcher ) {
			return;
		}

		// Register events directly with the dispatcher
		$model_name = static::class;
		$instance   = new static();
		$instance->registerEventsOnDispatcher( $dispatcher, $model_name );

		// When WooCommerce is active, always eager load orders to avoid N+1 queries.
		if ( quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ) ) {
			static::addGlobalScope(
				'withOrders',
				function ( $query ) {
					$query->with( 'orders' );
				}
			);
		}
	}

	/**
	 * Set tracking context for merge tags processing
	 * When set, merge tags will use stored values from communication_tracking_meta
	 *
	 * @param int $tracking_id Communication tracking ID
	 * @return self
	 */
	public function set_tracking_context( $tracking_id ) {
		$this->tracking_context_id = $tracking_id;
		return $this;
	}

	/**
	 * Get current tracking context
	 *
	 * @return int|null Communication tracking ID or null if not set
	 */
	public function get_tracking_context() {
		return $this->tracking_context_id;
	}

	/**
	 * Check if contact has tracking context set
	 *
	 * @return bool
	 */
	public function has_tracking_context() {
		return ! is_null( $this->tracking_context_id );
	}

	/**
	 * Clear tracking context
	 *
	 * @return self
	 */
	public function clear_tracking_context() {
		$this->tracking_context_id = null;
		return $this;
	}
}
