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
use QuillCRM\REST_API\Controllers\V1\REST_Template_Controller;
use QuillCRM\REST_API\Controllers\V1\Rest_Automation_Controller;
use QuillCRM\REST_API\Controllers\V1\Rest_Automation_Step_Controller;
use QuillCRM\REST_API\Controllers\V1\Rest_Automation_Contact_Controller;
use QuillCRM\REST_API\Controllers\V1\Rest_Form_Controller;
use QuillCRM\REST_API\Controllers\V1\REST_Link_Trigger_Controller;
use QuillCRM\REST_API\Controllers\V1\REST_Integration_Controller;
use QuillCRM\REST_API\Controllers\V1\REST_Settings_Controller;
use QuillCRM\REST_API\Controllers\V1\Rest_Abandoned_Cart_Controller;
use QuillCRM\REST_API\Controllers\V1\REST_General_Controller;
use QuillCRM\REST_API\Controllers\V1\Rest_Import_Export_Controller;
use QuillCRM\REST_API\Controllers\V1\REST_Log_Controller;
use QuillCRM\REST_API\Controllers\V1\REST_Automation_Reports_Controller;
use QuillCRM\REST_API\Controllers\V1\REST_Pipeline_Controller;
use QuillCRM\REST_API\Controllers\V1\REST_Deal_Controller;
use QuillCRM\REST_API\Controllers\V1\REST_Activity_Controller;
use QuillCRM\REST_API\Controllers\V1\REST_Stage_Controller;
use QuillCRM\REST_API\Controllers\V1\Rest_Reports_Controller;

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
	private function __clone() {} /* do nothing */

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
			REST_Template_Controller::class,
			Rest_Automation_Controller::class,
			Rest_Automation_Step_Controller::class,
			Rest_Automation_Contact_Controller::class,
			Rest_Form_Controller::class,
			REST_Link_Trigger_Controller::class,
			REST_Integration_Controller::class,
			REST_Settings_Controller::class,
			Rest_Abandoned_Cart_Controller::class,
			REST_General_Controller::class,
			Rest_Import_Export_Controller::class,
			REST_Log_Controller::class,
			REST_Automation_Reports_Controller::class,
			REST_Pipeline_Controller::class,
			REST_Deal_Controller::class,
			REST_Activity_Controller::class,
			REST_Stage_Controller::class,
			Rest_Reports_Controller::class,
		);

		foreach ( $controllers as $controller ) {
			$controller = new $controller();
			/** @var \QuillCRM\Abstracts\REST_Controller $controller */
			$controller->register_routes();
		}
	}
}
