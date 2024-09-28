<?php
/**
 * Class Abandoned_Cart_Model
 *
 * This class is responsible for handling the Abandoned Cart model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use QuillCRM\Models\Model;

/**
 * Abandoned_Cart_Model class
 */
class Abandoned_Cart_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_abandoned_carts';

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
		'hash_key',
		'user_id',
		'email',
		'fields',
		'items',
		'coupons',
		'total',
		'fees',
		'taxes',
		'shipping',
		'currency',
		'order_id',
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
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'fields'  => 'array',
		'items'   => 'array',
		'coupons' => 'array',
		'fees'    => 'array',
		'taxes'   => 'array',
	);

	/**
	 * Override the save method to add validation.
	 *
	 * @param array $options
	 * @return bool
	 * @throws \Exception
	 */
	public function save( array $options = array() ) {
		// Check if the email field is empty
		if ( empty( $this->email ) ) {
			throw new \Exception( 'Email field is required.' );
		}

		// Call the parent save method to perform the actual saving
		return parent::save( $options );
	}

	/**
	 * Create or update abandoned cart
	 *
	 * @param array $fields Fields.
	 *
	 * @return Abandoned_Cart_Model|false
	 */
	public static function createOrUpdate( $fields ) {
		$cart = self::where( 'email', $fields['email'] )->first();

		if ( ! $cart ) {
			$cart = new self();
		}

		$cart->fill( $fields );
		if ( $cart->save() ) {
			return $cart;
		}

		throw new \WP_Error( 'failed_to_save_abandoned_cart', __( 'Failed to save the abandoned cart.', 'quillcrm' ) );
	}

	/**
	 * Update abandoned cart by hash key
	 *
	 * @param string $hash_key Hash key.
	 *
	 * @return Abandoned_Cart_Model|false
	 */
	public static function updateByHashKey( $hash_key, $fields ) {
		$cart = self::where( 'hash_key', $hash_key )->first();

		if ( ! $cart ) {
			throw new \Exception( __( 'Abandoned cart not found.', 'quillcrm' ) );
		}

		$cart->fill( $fields );
		if ( $cart->save() ) {
			return $cart;
		}

		throw new \Exception( __( 'Failed to save the abandoned cart.', 'quillcrm' ) );
	}

	/**
	 * Get abandoned cart by hash key
	 *
	 * @param string $hash_key Hash key.
	 *
	 * @return Abandoned_Cart_Model|false
	 */
	public static function getByHashKey( $hash_key ) {
		return self::where( 'hash_key', $hash_key )->first();
	}
}
