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

use QuillCRM\Models\Model;
use QuillCRM\Models\List_Model;
use QuillCRM\Models\Tag_Model;
use QuillCRM\Models\Custom_Field_Model;
use QuillCRM\Models\Contact_Note_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\User_Model;
use QuillCRM\Models\Campaign_Email_Model;
use QuillCRM\Models\WC_Order_Model;

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
		'email',
		'first_name',
		'last_name',
		'phone',
		'address_1',
		'address_2',
		'city',
		'state',
		'country',
		'zip',
		'source',
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
	 * Rules
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public $rules = array(
		'email' => 'required|email',
		'phone' => 'nullable|regex:/^\+?[0-9]+$/',
		'zip'   => 'nullable|numeric',
	);

	/**
	 * Messages
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public $messages = array(
		'email.required' => 'Contact email field is required.',
		'email.email'    => 'Invalid email address.',
		'phone.regex'    => 'Invalid phone number.',
		'zip.numeric'    => 'Invalid zip code.',
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
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
	 */
	public function custom_fields() {
		return $this->belongsToMany( Custom_Field_Model::class, 'quillcrm_contact_custom_field_relationship', 'contact_id', 'custom_field_id' )->withPivot( 'value' );
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
		return $this->hasMany( Campaign_Email_Model::class, 'contact_id', 'id' );
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
	 * Get the contact custom field value
	 *
	 * @since 1.0.0
	 *
	 * @param int $custom_field_id Custom field ID
	 *
	 * @return string
	 */
	public function get_custom_field( $custom_field_id ) {
		$custom_field = $this->custom_fields->where( 'id', $custom_field_id )->first();
		if ( $custom_field ) {
			return $custom_field->pivot;
		}

		return null;
	}

	/**
	 * Get the contact notes
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function notes() {
		return $this->hasMany( Contact_Note_Model::class, 'contact_id', 'id' );
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
		return $this->hasMany( Automation_Contact_Process_Model::class, 'contact_id', 'id' );
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
	 * Create or update contact
	 *
	 * @param array $data Contact data
	 *
	 * @return Contact_Model
	 */
	public static function createOrUpdate( $data ) {
		$contact = self::where( 'email', $data['email'] ?? '' )->first();

		if ( ! $contact ) {
			$contact = new self();
		}

		$contact->fill( $data );
		$contact->save();

		return $contact;
	}

	/**
	 * Delete the contact notes boot method
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function boot() {
		parent::boot();

		static::deleting(
			function( $contact ) {
				$contact->notes()->delete();

				// Delete the contact from the automation contacts
				$contact->automation_contacts()->delete();
			}
		);

		parent::saved(
			function( $contact ) {
				if ( $contact->status == 'unsubscribed' ) {
					do_action( 'quillcrm_contact_unsubscribed', $contact );
				} else {
					do_action( 'quillcrm_contact_subscribed', $contact );
				}
			}
		);

		// Attach revenue to the contact if woo commerce is active in retreving contact.
		if ( quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ) ) {
			parent::retrieved(
				function( $contact ) {
					$orders  = $contact->orders;
					$revenue = 0;

					foreach ( $orders as $order ) {
						$revenue += $order->total_amount;
					}

					// WooCommerce Currency
					$currency = \get_woocommerce_currency();

					$contact->revenue = $revenue . ' ' . $currency;
				}
			);
		}

		// Save templates when saving the campaign
		static::saving(
			function( $contact ) {
				unset( $contact->revenue );
			}
		);
	}
}
