<?php
/**
 * Attachment model — private file storage for ticket conversations.
 *
 * Two-phase lifecycle:
 *   1. POST upload → row created with `ticket_id`, `activity_id=NULL`, `status='temp'`.
 *   2. Reply created → matching rows updated with `activity_id`, `status='active'`.
 *   3. Daily cleanup → temp rows older than 24h are deleted.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Support
 */

namespace DoubleScale\Modules\Support\Models;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Activities\Models\ActivityModel;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Core\Models\UserModel;
use WPEloquent\Eloquent\Model;

/**
 * AttachmentModel class.
 */
class AttachmentModel extends Model {

	/**
	 * Eloquent prepends `$wpdb->prefix` via the Capsule connection config.
	 *
	 * @var string
	 */
	protected $table = 'doublescale_support_attachments';

	/**
	 * Primary key.
	 *
	 * @var string
	 */
	protected $primary_key = 'id';

	/**
	 * Mass-assignable columns.
	 *
	 * @var string[]
	 */
	protected $fillable = array(
		'ticket_id',
		'activity_id',
		'user_id',
		'contact_id',
		'file_name',
		'file_path',
		'file_type',
		'file_size',
		'file_hash',
		'driver',
		'status',
	);

	/**
	 * Eloquent timestamps enabled.
	 *
	 * @var bool
	 */
	public $timestamps = true;

	/**
	 * Parent ticket.
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function ticket() {
		return $this->belongsTo( TicketModel::class, 'ticket_id', 'id' );
	}

	/**
	 * Activity (conversation row) this attachment belongs to. NULL while the
	 * attachment is in the temp phase.
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function activity() {
		return $this->belongsTo( ActivityModel::class, 'activity_id', 'id' );
	}

	/**
	 * Agent who uploaded (NULL for customer uploads).
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function user() {
		return $this->belongsTo( UserModel::class, 'user_id', 'ID' );
	}

	/**
	 * Customer who uploaded (NULL for agent uploads).
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function contact() {
		return $this->belongsTo( ContactModel::class, 'contact_id', 'id' );
	}

	/**
	 * Scope: only temp rows (uploaded but not yet linked to a conversation).
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeTemp( $query ) {
		return $query->where( 'status', 'temp' );
	}

	/**
	 * Scope: only active rows (linked to a conversation).
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeActive( $query ) {
		return $query->where( 'status', 'active' );
	}

	/**
	 * Look up by signed-URL hash.
	 *
	 * @param string $file_hash File hash.
	 * @return self|null
	 */
	public static function get_by_hash( $file_hash ) {
		return self::where( 'file_hash', $file_hash )->first();
	}

	/**
	 * Boot — auto-generate `file_hash` on create, unlink the physical file on
	 * delete (loop-delete from parent models is required for this to fire).
	 *
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
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_is_writable -- WP_Filesystem is unavailable inside a model event; the file is owned by this plugin's private uploads dir.
				if ( '' !== $absolute && is_file( $absolute ) && is_writable( $absolute ) ) {
					// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink,WordPress.PHP.NoSilencedErrors.Discouraged -- Direct unlink with @ suppression: unlink can race with another delete path and emit a warning we cannot meaningfully recover from inside a model event.
					@unlink( $absolute );
				}
			}
		);
	}

	/**
	 * Resolve a relative `file_path` (stored as
	 * "doublescale-support/2026/05/abc.png") to an absolute uploads path.
	 *
	 * @param string $relative_path Stored relative path.
	 * @return string Absolute path or '' if the uploads dir is unavailable.
	 */
	private static function resolve_absolute_path( $relative_path ) {
		if ( '' === $relative_path ) {
			return '';
		}
		if ( ! function_exists( 'wp_upload_dir' ) ) {
			return '';
		}
		$upload = wp_upload_dir( null, false, false );
		if ( ! is_array( $upload ) || empty( $upload['basedir'] ) ) {
			return '';
		}
		return rtrim( (string) $upload['basedir'], '/\\' ) . '/' . ltrim( $relative_path, '/\\' );
	}
}
