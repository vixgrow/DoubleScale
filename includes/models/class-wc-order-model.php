<?php
/**
 * Class WC_Order_Model
 *
 * This class is responsible for handling the WooCommerce order model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use QuillCRM\Models\Model;

/**
 * WC_Order_Model class
 */
class WC_Order_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'wc_orders';

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
		'id',
		'status',
		'currency',
		'type',
		'tax_amount',
		'total_amount',
		'customer_id',
		'billing_email',
		'date_created_gmt',
		'date_updated_gmt',
		'parent_order_id',
		'payment_method',
		'payment_method_title',
		'transaction_id',
		'ip_address',
		'user_agent',
		'customer_note',
	);

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'id'               => 'integer',
		'customer_id'      => 'integer',
		'tax_amount'       => 'float',
		'total_amount'     => 'float',
		'date_created_gmt' => 'datetime',
		'date_updated_gmt' => 'datetime',
		'parent_order_id'  => 'integer',
	);

	/**
	 * Get contacts
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function contact() {
		return $this->belongsTo( Contact_Model::class, 'email', 'billing_email' );
	}

	/**
	 * Boot method
	 *
	 * @since 1.0.0
	 */
	public static function boot() {
		parent::boot();

		// Add order status name not slug while retrieving
		static::retrieved(
			function ( $order ) {
				$status        = $order->status;
				$order->status = wc_get_order_status_name( $status );
				$order->url    = get_edit_post_link( $order->id );
			}
		);
	}
}
