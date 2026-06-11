<?php
/**
 * Invoice model.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Models;

defined( 'ABSPATH' ) || exit;

use WPEloquent\Eloquent\Model;
use DoubleScale\Core\Models\UserModel;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Contacts\Models\TagModel;
use DoubleScale\Modules\Sales\Constants\InvoiceStatus;
use DoubleScale\Modules\Sales\Services\SalesNumbering;
use DoubleScale\Modules\Sales\Services\TotalsCalculator;

/**
 * InvoiceModel class.
 */
class InvoiceModel extends Model {

	/**
	 * @var string
	 */
	protected $table = 'doublescale_sales_invoices';

	/**
	 * @var string
	 */
	protected $primary_key = 'id';

	/**
	 * @var string[]
	 */
	protected $fillable = array(
		'invoice_number',
		'hash',
		'status',
		'contact_id',
		'proposal_id',
		'sale_agent_user_id',
		'invoice_date',
		'due_date',
		'currency',
		'allowed_payment_modes',
		'discount_type',
		'discount_value',
		'tag_ids',
		'line_items',
		'subtotal',
		'total_tax',
		'adjustment',
		'total',
		'amount_paid',
		'stripe_payment_intent_id',
		'billing_address',
		'shipping_address',
		'client_note',
		'terms',
		'sent_at',
		'viewed_at',
	);

	/**
	 * @var array<string, string>
	 */
	protected $casts = array(
		'tag_ids'                => 'array',
		'line_items'             => 'array',
		'allowed_payment_modes'  => 'array',
		'discount_value'         => 'float',
		'subtotal'               => 'float',
		'total_tax'              => 'float',
		'adjustment'             => 'float',
		'total'                  => 'float',
		'amount_paid'            => 'float',
	);

	/**
	 * @var bool
	 */
	public $timestamps = true;

	/**
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function contact() {
		return $this->belongsTo( ContactModel::class, 'contact_id', 'id' );
	}

	/**
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function proposal() {
		return $this->belongsTo( ProposalModel::class, 'proposal_id', 'id' );
	}

	/**
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function sale_agent() {
		return $this->belongsTo( UserModel::class, 'sale_agent_user_id', 'ID' );
	}

	/**
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function payments() {
		return $this->hasMany( PaymentModel::class, 'invoice_id', 'id' );
	}

	/**
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	public function tags() {
		$ids = is_array( $this->tag_ids ) ? array_filter( array_map( 'intval', $this->tag_ids ) ) : array();
		if ( empty( $ids ) ) {
			return TagModel::query()->whereRaw( '0=1' )->get();
		}
		return TagModel::query()->whereIn( 'id', $ids )->get();
	}

	/**
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 * @param string                                $status Status value.
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeByStatus( $query, $status ) {
		return $query->where( 'status', $status );
	}

	/**
	 * @return void
	 */
	public static function boot() {
		parent::boot();

		static::creating(
			function ( $invoice ) {
				if ( empty( $invoice->hash ) ) {
					$invoice->hash = self::generate_hash();
				}
				if ( empty( $invoice->invoice_number ) ) {
					$invoice->invoice_number = SalesNumbering::next_invoice_number();
				}
				if ( empty( $invoice->status ) ) {
					$invoice->status = InvoiceStatus::DRAFT;
				}
			}
		);

		static::saving(
			function ( $invoice ) {
				$totals = TotalsCalculator::compute(
					$invoice->line_items,
					(string) ( $invoice->discount_type ?? 'none' ),
					(float) ( $invoice->discount_value ?? 0 ),
					(float) ( $invoice->adjustment ?? 0 )
				);
				$invoice->subtotal  = $totals['subtotal'];
				$invoice->total_tax = $totals['total_tax'];
				$invoice->total     = $totals['total'];
			}
		);
	}

	/**
	 * @param string $hash Invoice hash.
	 * @return InvoiceModel|null
	 */
	public static function get_by_hash( $hash ) {
		$hash = trim( (string) $hash );
		if ( '' === $hash || ! preg_match( '/^[a-f0-9]{32}$/', $hash ) ) {
			return null;
		}
		return self::query()->where( 'hash', $hash )->first();
	}

	/**
	 * @return string
	 */
	private static function generate_hash() {
		try {
			return md5( random_bytes( 16 ) );
		} catch ( \Throwable $e ) {
			return md5( uniqid( (string) wp_rand(), true ) );
		}
	}
}
