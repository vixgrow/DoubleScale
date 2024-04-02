<?php
/**
 * REST API: class REST_API
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage REST_API
 */

namespace QuillCRM\REST_API;

use QuillCRM\REST_API\Controllers\V1\REST_Contact_Controller;
use QuillCRM\REST_API\Controllers\V1\REST_List_Controller;
use QuillCRM\REST_API\Controllers\V1\REST_Tag_Controller;
use QuillCRM\REST_API\Controllers\V1\REST_Custom_Fields_Group_Controller;
use QuillCRM\REST_API\Controllers\V1\REST_Custom_Field_Controller;
use QuillCRM\REST_API\Controllers\V1\Rest_Contact_Note_Controller;
use QuillCRM\REST_API\Controllers\V1\REST_Campaign_Controller;

/**
 * REST_API class is mainly responsible for registering routes.
 *
 * @since 1.0.0
 */
class REST_API {

	/**
	 *  Class singleton instance
	 *
	 * @since 1.0.0
	 *
	 * @var object $_instance The singleton instance.
	 */
	private static $_instance = null;

	/**
	 * Get instance as a singleton.
	 *
	 * @since 1.0.0
	 *
	 * @return self $_instance An instance of the REST_API class
	 */
	public static function instance() {
		if ( null === self::$_instance ) {
			self::$_instance = new self();
		}
		return self::$_instance;
	}

	/**
	 * Cloning the singletone.
	 *
	 * @since 1.0.0
	 */
	private function __clone() {
	} /* do nothing */

	/**
	 * REST_API constructor.
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Register REST API routes
	 *
	 * @since 1.0.0
	 */
	public function register_rest_routes() {
		$controllers = array(
			REST_Contact_Controller::class,
			REST_List_Controller::class,
			REST_Tag_Controller::class,
			REST_Custom_Fields_Group_Controller::class,
			REST_Custom_Field_Controller::class,
			Rest_Contact_Note_Controller::class,
			REST_Campaign_Controller::class,
		);

		foreach ( $controllers as $controller ) {
			$controller = new $controller();
			/** @var \QuillCRM\Abstracts\REST_Controller $controller */
			$controller->register_routes();
		}
	}
}
