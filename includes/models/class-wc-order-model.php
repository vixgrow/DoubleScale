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
	 * Get contacts
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function contact() {
		return $this->belongsTo( Contact_Model::class, 'email', 'billing_email' );
	}
}
