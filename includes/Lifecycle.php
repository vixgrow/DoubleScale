<?php
/**
 * Plugin lifecycle: constants, dependency loading, activation, deactivation,
 * and the deferred kernel bootstrap. Keeps the main plugin file paper-thin.
 *
 * @package DoubleScale
 */

namespace DoubleScale;

defined( 'ABSPATH' ) || exit;

final class Lifecycle {

	/**
	 * Action Scheduler / WP-Cron hooks cleared on deactivation.
	 */
	private const SCHEDULED_HOOKS = array(
		'doublescale_email_campaigns',
		'doublescale_email_sequences',
		'doublescale_daily3',
		'doublescale_daily4',
		'doublescale_cleanup_page_visits',
	);

	/**
	 * Entry point. Called once from the main plugin file.
	 */
	public static function boot( string $plugin_file ): void {
		self::define_constants( $plugin_file );
		self::load_dependencies();
		self::register_hooks( $plugin_file );
	}

	/**
	 * Define plugin-wide constants.
	 */
	private static function define_constants( string $plugin_file ): void {
		$defaults = array(
			'DOUBLESCALE_PLUGIN_FILE'   => $plugin_file,
			'DOUBLESCALE_VERSION'       => '1.2.7',
			'DOUBLESCALE_PLUGIN_DIR'    => plugin_dir_path( $plugin_file ),
			'DOUBLESCALE_PLUGIN_URL'    => plugin_dir_url( $plugin_file ),
			'DOUBLESCALE_PLUGIN_PATH'   => plugin_basename( $plugin_file ),
			'DOUBLESCALE_PRO_PRICE_URL' => 'https://doublescale.io/pricing',
		);

		foreach ( $defaults as $name => $value ) {
			if ( ! defined( $name ) ) {
				// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.VariableConstantNameFound -- $name is bound to the DOUBLESCALE_* keys from $defaults above; all are plugin-prefixed.
				define( $name, $value );
			}
		}
	}

	/**
	 * Require Composer + custom autoloaders.
	 */
	private static function load_dependencies(): void {
		$dir = DOUBLESCALE_PLUGIN_DIR;

		require_once $dir . 'includes/safe-redirect.php';
		require_once $dir . 'dependencies/libraries/load.php';

		$doublescale_scoped_deps     = $dir . 'dependencies/build/vendor/scoper-autoload.php';
		$vendor_autoload             = $dir . 'dependencies/vendor/autoload.php';
		$doublescale_root_composer   = $dir . 'vendor/autoload.php';
		$doublescale_composer_loader = null;

		if ( file_exists( $doublescale_scoped_deps ) ) {
			$doublescale_composer_loader = require $doublescale_scoped_deps;
		} elseif ( file_exists( $vendor_autoload ) ) {
			require_once $vendor_autoload;
		} elseif ( file_exists( $doublescale_root_composer ) ) {
			$doublescale_composer_loader = require $doublescale_root_composer;
		}

		/*
		 * If the scoper-autoload was previously included (e.g. by Pro's
		 * bootstrap when Pro loads before Free), `require` returns true
		 * instead of the ClassLoader. Recover the existing loader by scanning
		 * the spl autoload chain for the Composer ClassLoader whose vendor dir
		 * is rooted under this plugin.
		 */
		if ( ! $doublescale_composer_loader instanceof \Composer\Autoload\ClassLoader ) {
			$doublescale_vendor_dir = $dir . 'dependencies/build/vendor';
			foreach ( spl_autoload_functions() as $doublescale_spl_fn ) {
				if ( ! is_array( $doublescale_spl_fn ) || ! isset( $doublescale_spl_fn[0] ) ) {
					continue;
				}
				$doublescale_spl_obj = $doublescale_spl_fn[0];
				if ( ! $doublescale_spl_obj instanceof \Composer\Autoload\ClassLoader ) {
					continue;
				}
				foreach ( $doublescale_spl_obj->getPrefixesPsr4() as $doublescale_paths ) {
					foreach ( (array) $doublescale_paths as $doublescale_path ) {
						if ( 0 === strpos( $doublescale_path, $doublescale_vendor_dir ) ) {
							$doublescale_composer_loader = $doublescale_spl_obj;
							break 3;
						}
					}
				}
			}
		}

		if ( $doublescale_composer_loader instanceof \Composer\Autoload\ClassLoader
			&& file_exists( $doublescale_scoped_deps )
			&& file_exists( $doublescale_root_composer ) ) {
			$doublescale_root_classmap = $dir . 'vendor/composer/autoload_classmap.php';
			if ( is_readable( $doublescale_root_classmap ) ) {
				$doublescale_classmap      = require $doublescale_root_classmap;
				$doublescale_includes_root = $dir . 'includes/';
				$doublescale_plugin_map    = array();
				foreach ( $doublescale_classmap as $doublescale_fqcn => $doublescale_path ) {
					if ( 0 !== strpos( $doublescale_fqcn, 'DoubleScale\\' ) ) {
						continue;
					}
					if ( 0 === strpos( $doublescale_fqcn, 'DoubleScale\\Tests\\' ) ) {
						continue;
					}
					if ( 0 === strpos( $doublescale_fqcn, 'DoubleScale\\Vendor\\' ) ) {
						continue;
					}
					if ( 0 !== strpos( $doublescale_path, $doublescale_includes_root ) ) {
						continue;
					}
					$doublescale_plugin_map[ $doublescale_fqcn ] = $doublescale_path;
				}
				if ( $doublescale_plugin_map ) {
					$doublescale_composer_loader->addClassMap( $doublescale_plugin_map );
				}
			}
		}

		if ( file_exists( $dir . 'includes/Autoload.php' ) ) {
			require_once $dir . 'includes/Autoload.php';
		}

		// Gate helpers (e.g. doublescale_sales_documents_ready) must exist before
		// activation migrations — Install::install() runs on register_activation_hook,
		// which fires before PluginKernel loads includes/Core/functions.php.
		require_once $dir . 'includes/Core/functions.php';

		require_once $dir . 'includes/Compat/LegacyProBookingPayment.php';
		\DoubleScale\Compat\LegacyProBookingPayment::ensure_loaded();
	}

	/**
	 * Register WordPress lifecycle hooks.
	 */
	private static function register_hooks( string $plugin_file ): void {
		if ( is_multisite() ) {
			register_activation_hook( $plugin_file, array( __CLASS__, 'on_multisite_activate' ) );
			add_action( 'wpmu_new_blog', array( __CLASS__, 'on_new_blog' ) );
		} else {
			register_activation_hook( $plugin_file, array( __CLASS__, 'on_activate' ) );
		}

		register_deactivation_hook( $plugin_file, array( __CLASS__, 'on_deactivate' ) );

		add_action( 'plugins_loaded', array( __CLASS__, 'on_plugins_loaded' ), 5 );

		// Suppress WP 6.7+'s "translation loaded too early" notice for the
		// `doublescale` domain. This codebase's modular boot fires
		// `doublescale_ready` at plugins_loaded priority 5, before WP's `init`
		// action, and many service managers call `__()` during their
		// registration handlers. Refactoring every such call to defer to `init`
		// is invasive and high-risk; suppressing the specific _doing_it_wrong
		// trigger for this domain is the documented WP-supported workaround.
		add_filter(
			'doing_it_wrong_trigger_error',
			static function ( $trigger, $function, $message ) {
				if ( '_load_textdomain_just_in_time' === $function
					&& is_string( $message )
					&& false !== strpos( $message, 'doublescale' )
				) {
					return false;
				}
				return $trigger;
			},
			10,
			3
		);
	}

	/**
	 * Single-site activation.
	 */
	public static function on_activate(): void {
		if ( class_exists( \DoubleScale\Database\Install::class ) ) {
			\DoubleScale\Database\Install::install();
		}
	}

	/**
	 * Multisite network activation.
	 *
	 * @param bool $network_wide Whether the plugin is being activated network-wide.
	 */
	public static function on_multisite_activate( $network_wide = false ): void {
		if ( class_exists( \DoubleScale\Database\Install::class ) ) {
			\DoubleScale\Database\Install::multisite_activate( $network_wide );
		}
	}

	/**
	 * New blog hook on multisite.
	 *
	 * @param int $blog_id
	 */
	public static function on_new_blog( $blog_id ): void {
		if ( class_exists( \DoubleScale\Database\Install::class ) ) {
			\DoubleScale\Database\Install::activate_new_site( $blog_id );
		}
	}

	/**
	 * Deactivation: clear scheduled hooks owned by this plugin.
	 */
	public static function on_deactivate(): void {
		foreach ( self::SCHEDULED_HOOKS as $hook ) {
			wp_clear_scheduled_hook( $hook );
		}
	}

	/**
	 * Boot the modular kernel after WordPress finishes loading plugins.
	 */
	public static function on_plugins_loaded(): void {
		if ( class_exists( \DoubleScale\Database\Install::class ) ) {
			\DoubleScale\Database\Install::ensure_db_ready();
		}

		\DoubleScale\Core\Bootstrap::init();

		/**
		 * Fires after the DoubleScale (free) modular stack is fully initialized.
		 */
		do_action( 'doublescale_ready' );
	}
}
