<?php
/**
 * Contract model.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Models;

defined( 'ABSPATH' ) || exit;

use WPEloquent\Eloquent\Model;
use DoubleScale\Core\Models\UserModel;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Contacts\Models\TagModel;
use DoubleScale\Modules\Sales\Constants\ContractStatus;
use DoubleScale\Modules\Sales\Services\SalesNumbering;

/**
 * ContractModel class.
 */
class ContractModel extends Model {

	/**
	 * @var string
	 */
	protected $table = 'doublescale_sales_contracts';

	/**
	 * @var string
	 */
	protected $primary_key = 'id';

	/**
	 * @var string[]
	 */
	protected $fillable = array(
		'contract_number',
		'hash',
		'subject',
		'status',
		'contact_id',
		'assigned_user_id',
		'contract_type_id',
		'contract_value',
		'currency',
		'start_date',
		'end_date',
		'description',
		'tag_ids',
		'hide_from_customer',
		'is_trash',
		'signed_name',
		'signature',
		'signed_ip',
		'signed_at',
		'sent_at',
		'viewed_at',
	);

	/**
	 * @var array<string, string>
	 */
	protected $casts = array(
		'tag_ids'            => 'array',
		'contract_value'     => 'float',
		'hide_from_customer' => 'boolean',
		'is_trash'           => 'boolean',
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
	public function assigned_user() {
		return $this->belongsTo( UserModel::class, 'assigned_user_id', 'ID' );
	}

	/**
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function type() {
		return $this->belongsTo( ContractTypeModel::class, 'contract_type_id', 'id' );
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
			function ( $contract ) {
				if ( empty( $contract->hash ) ) {
					$contract->hash = self::generate_hash();
				}
				if ( empty( $contract->contract_number ) ) {
					$contract->contract_number = SalesNumbering::next_contract_number();
				}
				if ( empty( $contract->status ) ) {
					$contract->status = ContractStatus::DRAFT;
				}
			}
		);
	}

	/**
	 * @param string $hash Contract hash.
	 * @return ContractModel|null
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
