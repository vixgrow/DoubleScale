<?php
/**
 * Contract attachment model.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Models;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Models\UserModel;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use WPEloquent\Eloquent\Model;

/**
 * ContractAttachmentModel class.
 */
class ContractAttachmentModel extends Model {

	/**
	 * @var string
	 */
	protected $table = 'doublescale_sales_contract_attachments';

	/**
	 * @var string
	 */
	protected $primary_key = 'id';

	/**
	 * @var string[]
	 */
	protected $fillable = array(
		'contract_id',
		'user_id',
		'contact_id',
		'file_name',
		'file_path',
		'file_type',
		'file_size',
		'file_hash',
	);

	/**
	 * @var bool
	 */
	public $timestamps = true;

	/**
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function contract() {
		return $this->belongsTo( ContractModel::class, 'contract_id', 'id' );
	}

	/**
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function user() {
		return $this->belongsTo( UserModel::class, 'user_id', 'ID' );
	}

	/**
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function contact() {
		return $this->belongsTo( ContactModel::class, 'contact_id', 'id' );
	}

	/**
	 * @param string $file_hash File hash.
	 * @return self|null
	 */
	public static function get_by_hash( $file_hash ) {
		$file_hash = trim( (string) $file_hash );
		if ( '' === $file_hash ) {
			return null;
		}
		return self::query()->where( 'file_hash', $file_hash )->first();
	}

	/**
	 * @return void
	 */
	public static function boot() {
		parent::boot();

		static::creating(
			function ( $attachment ) {
				if ( empty( $attachment->file_hash ) ) {
					try {
						$attachment->file_hash = bin2hex( random_bytes( 24 ) );
					} catch ( \Throwable $e ) {
						$attachment->file_hash = wp_generate_password( 48, false, false );
					}
				}
			}
		);

		static::deleting(
			function ( $attachment ) {
				$absolute = self::resolve_absolute_path( (string) $attachment->file_path );
				if ( '' !== $absolute && is_file( $absolute ) && is_writable( $absolute ) ) {
					// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink,WordPress.PHP.NoSilencedErrors.Discouraged
					@unlink( $absolute );
				}
			}
		);
	}

	/**
	 * @param string $relative_path Stored relative path.
	 * @return string
	 */
	public static function resolve_absolute_path( $relative_path ) {
		if ( '' === $relative_path || ! function_exists( 'wp_upload_dir' ) ) {
			return '';
		}
		$upload = wp_upload_dir( null, false, false );
		if ( ! is_array( $upload ) || empty( $upload['basedir'] ) ) {
			return '';
		}
		return rtrim( (string) $upload['basedir'], '/\\' ) . '/' . ltrim( $relative_path, '/\\' );
	}
}
