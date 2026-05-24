<?php
/**
 * Mailbox model — a routing channel (department) for tickets.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Support
 */

namespace DoubleScale\Modules\Support\Models;

defined( 'ABSPATH' ) || exit;

use Illuminate\Database\Capsule\Manager as Capsule;
use WPEloquent\Eloquent\Model;

/**
 * MailboxModel class.
 */
class MailboxModel extends Model {

	/**
	 * Eloquent prepends `$wpdb->prefix` via the Capsule connection config.
	 *
	 * @var string
	 */
	protected $table = 'doublescale_support_mailboxes';

	/**
	 * Primary key.
	 *
	 * @var string
	 */
	protected $primary_key = 'id';

	/**
	 * Mass-assignable columns. `data` is a JSON blob stored as LONGTEXT so the
	 * accessor/mutator below handle the encode/decode boundary.
	 *
	 * @var string[]
	 */
	protected $fillable = array(
		'slug',
		'email',
		'box_type',
		'is_default',
		'data',
	);

	/**
	 * Casts.
	 *
	 * @var array<string, string>
	 */
	protected $casts = array(
		'is_default' => 'boolean',
	);

	/**
	 * Eloquent timestamps enabled.
	 *
	 * @var bool
	 */
	public $timestamps = true;

	/**
	 * Tickets routed through this mailbox.
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function tickets() {
		return $this->hasMany( TicketModel::class, 'mailbox_id', 'id' );
	}

	/**
	 * Decoded `data` blob as an associative array.
	 *
	 * @param mixed $value Raw value from the DB.
	 * @return array
	 */
	public function getDataAttribute( $value ) {
		if ( is_string( $value ) ) {
			$decoded = json_decode( $value, true );
			return is_array( $decoded ) ? $decoded : array();
		}
		return is_array( $value ) ? $value : array();
	}

	/**
	 * Encode the `data` blob on write.
	 *
	 * @param mixed $value Array or pre-encoded string.
	 */
	public function setDataAttribute( $value ) {
		if ( is_array( $value ) ) {
			$this->attributes['data'] = wp_json_encode( $value );
		} else {
			$this->attributes['data'] = $value;
		}
	}

	/**
	 * Convenience accessor — display name pulled from the JSON, falling back
	 * to the slug so a half-configured mailbox still has a label.
	 *
	 * @return string
	 */
	public function getNameAttribute() {
		$data = $this->data;
		return $data['name'] ?? $this->slug;
	}

	/**
	 * The mailbox flagged as default for new tickets, or NULL.
	 *
	 * @return self|null
	 */
	public static function get_default() {
		return self::where( 'is_default', 1 )->first();
	}

	/**
	 * Override save to recover from slug UNIQUE-collisions that race past the
	 * counter loop in the boot creating event (concurrent imports, retries).
	 *
	 * @param array $options Eloquent save options.
	 * @return bool
	 */
	public function save( array $options = array() ) {
		try {
			return parent::save( $options );
		} catch ( \Illuminate\Database\QueryException $e ) {
			if ( false !== strpos( $e->getMessage(), 'slug' ) ) {
				$this->slug = $this->slug . '-' . substr( wp_generate_uuid4(), 0, 8 );
				return parent::save( $options );
			}
			throw $e;
		}
	}

	/**
	 * Boot — auto-generate slug from name on create, ensure only one default.
	 *
	 * @return void
	 */
	public static function boot() {
		parent::boot();

		static::creating(
			function ( $mailbox ) {
				if ( empty( $mailbox->slug ) ) {
					$data = $mailbox->data;
					$name = $data['name'] ?? $mailbox->email;
					$slug = sanitize_title( $name );

					if ( empty( $slug ) ) {
						$slug = 'mailbox-' . substr( md5( uniqid( '', true ) ), 0, 8 );
					}

					$base    = $slug;
					$counter = 2;
					while ( self::where( 'slug', $slug )->exists() ) {
						$slug = $base . '-' . $counter;
						++$counter;
					}

					$mailbox->slug = $slug;
				}
			}
		);

		static::saving(
			function ( $mailbox ) {
				if ( $mailbox->is_default ) {
					Capsule::transaction(
						function () use ( $mailbox ) {
							self::where( 'id', '!=', $mailbox->id ?? 0 )
								->where( 'is_default', 1 )
								->update( array( 'is_default' => 0 ) );
						}
					);
				}
			}
		);
	}
}
