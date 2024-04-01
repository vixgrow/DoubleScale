<?php
/**
 * Main class: class QuillCRM
 *
 * @since   1.0.0
 * @package QuillCRM
 */

namespace QuillCRM;

use QuillCRM\Database\Install;
use QuillCRM\REST_API\REST_API;
use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Events\Dispatcher;
use Illuminate\Container\Container;

/**
 * QuillCRM Main Class.
 * The main class that's responsible for loading all dependencies
 *
 * @since 1.0.0
 */
final class QuillCRM {

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var QuillCRM
	 */
	private static $instance;

	/**
	 * QuillCRM Instance.
	 *
	 * Instantiates or reuses an instance of QuillCRM.
	 *
	 * @since  1.0.0
	 * @static
	 *
	 * @return self - Single instance
	 */
	public static function instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		register_activation_hook( QUILLCRM_PLUGIN_FILE, array( Install::class, 'install' ) );
		$this->init_illuminate();
		$this->init_objects();
		$this->init_hooks();
	}

	/**
	 * Get readonly property
	 *
	 * @param  string $name Property name.
	 * @return mixed
	 */
	public function __get( $name ) {
		return $this->$name;
	}

	/**
	 * Isset for readonly property
	 *
	 * @param  string $name Property name.
	 * @return boolean
	 */
	public function __isset( $name ) {
		return isset( $this->$name );
	}

	/**
	 * This method for illuminate events
	 *
	 * @since 1.0.0
	 */
	private function init_illuminate() {
		$capsule = new Capsule();

		$capsule->addConnection(
			array(
				'driver'    => 'mysql',
				'host'      => DB_HOST,
				'database'  => DB_NAME,
				'username'  => DB_USER,
				'password'  => DB_PASSWORD,
				'charset'   => DB_CHARSET,
				'collation' => DB_COLLATE,
				'prefix'    => '',
			)
		);

		$capsule->setEventDispatcher( new Dispatcher( new Container ) );

		$capsule->setAsGlobal();

		$capsule->bootEloquent();
	}

	/**
	 * Initialize instances from classes loaded.
	 *
	 * @since 1.0.0
	 */
	private function init_objects() {
		REST_API::instance();
	}

	/**
	 * Initialize hooks
	 *
	 * @since 1.0.0
	 */
	private function init_hooks() {

	}

	/**
	 * Flush rewrite rules
	 *
	 * @since 2.13.3
	 */
	public function flush_rewrite_rules() {

		if ( ! $option = get_option( 'quillcrm-flush-rewrite-rules' ) ) {
			return false;
		}

		if ( $option == 1 ) {

			flush_rewrite_rules();
			update_option( 'quillcrm-flush-rewrite-rules', 0 );

		}

		return true;

	}
}
