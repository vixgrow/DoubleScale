<?php
/**
 * Class: License
 *
 * @since 1.6.0
 * @package QuillCRM
 */

namespace QuillCRM\Site;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use QuillCRM\QuillCRM;
use Automatic_Upgrader_Skin;
use Plugin_Upgrader;

/**
 * License Class
 *
 * @since 1.6.0
 */
class License {

	/**
	 * Plans
	 *
	 * @since 1.6.0
	 *
	 * @var array
	 */
	private $plans;

	/**
	 * Plugin data
	 *
	 * @since 1.2.3
	 *
	 * @var array
	 */
	public $plugin_data;

	/**
	 * Class instance
	 *
	 * @since 1.6.0
	 *
	 * @var self instance
	 */
	private static $instance = null;

	/**
	 * Get class instance
	 *
	 * @since 1.6.0
	 *
	 * @return self
	 */
	public static function instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor
	 *
	 * @since 1.6.0
	 */
	private function __construct() {
		$this->define_plugin();
		$this->define_plans();

		add_action( 'quillcrm_loaded', array( $this, 'license_update_task' ), 100 );

		// ajax.
		add_action( 'wp_ajax_quillcrm_license_activate', array( $this, 'ajax_activate' ) );
		add_action( 'wp_ajax_quillcrm_license_update', array( $this, 'ajax_update' ) );
		add_action( 'wp_ajax_quillcrm_license_deactivate', array( $this, 'ajax_deactivate' ) );
		add_action( 'wp_ajax_quillcrm_install_pro', array( $this, 'ajax_install_pro' ) );
		add_action( 'wp_ajax_quillcrm_activate_pro', array( $this, 'ajax_activate_pro' ) );
	}

	/**
	 * Ajax install pro
	 *
	 * @since 1.6.0
	 *
	 * @return void
	 */
	public function ajax_install_pro() {
		$this->check_authorization();

		if ( $this->plugin_data['is_installed'] ) {
			wp_send_json_error( esc_html__( 'QuillCRM Pro is already installed', 'quill-crm' ), 403 );
			exit;
		}

		$install = $this->install();
		if ( $install['success'] ) {
			wp_send_json_success( $install['message'], 200 );
		} else {
			wp_send_json_error( $install['message'] );
		}
	}

	/**
	 * Ajax activate pro
	 *
	 * @since 1.6.0
	 *
	 * @return void
	 */
	public function ajax_activate_pro() {
		$this->check_authorization();

		if ( ! $this->plugin_data['is_installed'] ) {
			wp_send_json_error( esc_html__( 'QuillCRM Pro is not installed', 'quill-crm' ), 403 );
			exit;
		}

		if ( $this->plugin_data['is_active'] ) {
			wp_send_json_error( esc_html__( 'QuillCRM Pro is already active', 'quill-crm' ), 403 );
			exit;
		}

		if ( ! function_exists( 'activate_plugin' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		try {
			$result = activate_plugin( $this->plugin_data['plugin_file'] );
			if ( is_wp_error( $result ) ) {
				// quillbooking_get_logger()->error(
				// 	esc_html__( 'Cannot activate QuillCRM Pro', 'quill-crm' ),
				// 	array(
				// 		'code'  => 'cannot_activate_pro',
				// 		'error' => $result,
				// 	)
				// );
			}
			wp_send_json_success( esc_html__( 'QuillCRM Pro activated successfully', 'quill-crm' ), 200 );
		} catch ( \Exception $e ) {
			// quillbooking_get_logger()->error(
			// 	esc_html__( 'Cannot activate QuillCRM Pro', 'quill-crm' ),
			// 	array(
			// 		'code'  => 'cannot_activate_pro',
			// 		'error' => $e,
			// 	)
			// );
			wp_send_json_error( esc_html__( 'Cannot activate QuillCRM Pro, check log for details', 'quill-crm' ) );
		}
	}

	/**
	 * Define plugin data
	 *
	 * @since 1.2.3
	 *
	 * @return void
	 */
	private function define_plugin() {
		if ( ! function_exists( 'is_plugin_active' ) || ! function_exists( 'get_plugin_data' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/plugin.php' );
		}

		// base dir of plugins (with trailing slash) instead of WP_PLUGIN_DIR.
		$plugins_dir = trailingslashit( dirname( dirname( QUILLCRM_PLUGIN_FILE ) ) );

		// get plugin data.
		$plugin_file      = 'QuillCRM-Pro/quillcrm-pro.php';
		$full_plugin_file = $plugins_dir . $plugin_file;
		$plugin_exists    = file_exists( $full_plugin_file );
		$plugin_data      = $plugin_exists ? get_plugin_data( $full_plugin_file, true, false ) : array();

		$data                     = [];
		$data['plugin_file']      = $plugin_file;
		$data['full_plugin_file'] = $full_plugin_file;
		$data['is_installed']     = $plugin_exists;
		$data['is_active']        = is_plugin_active( $plugin_file );
		$data['version']          = $plugin_data['Version'] ?? null;
		$data['slug']             = 'QuillCRM-Pro';

		$this->plugin_data = $data;
	}

	/**
	 * Install plugin
	 *
	 * @return array
	 */
	public function install() {
		// check if already installed.
		if ( $this->plugin_data['is_installed'] ) {
			return array(
				'success' => false,
				'message' => esc_html__( 'QuillCRM Pro is already installed', 'quill-crm' ),
			);
		}

		// check current license.
		$license = get_option( 'quillcrm_license' );
		if ( ! $license ) {
			return array(
				'success' => false,
				'message' => esc_html__( 'No license found', 'quill-crm' ),
			);
		}

		// get plugin data from the api.
		$plugin_data = Site::instance()->api_request(
			array(
				'edd_action' => 'get_version',
				'license'    => $license['key'],
				'item_id'    => 'quillcrm-pro',
			)
		);

		// check download link.
		$download_link = $plugin_data['data']['download_link'] ?? null;
		if ( empty( $download_link ) ) {
			// quillbooking_get_logger()->debug(
			// 	esc_html__( 'Cannot get plugin info', 'quill-crm' ),
			// 	array(
			// 		'code'        => 'cannot_get_plugin_info',
			// 		'plugin_slug' => $this->plugin_data['slug'],
			// 		'response'    => $plugin_data,
			// 	)
			// );
			return array(
				'success' => false,
				'message' => esc_html__( 'Cannot get plugin info, please check your license', 'quill-crm' ),
			);
		}

		// init plugin upgrader.
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		$installer_skin = new Automatic_Upgrader_Skin();
		$installer      = new Plugin_Upgrader( $installer_skin );

		// check file system permissions.
		$filesystem_access = $installer_skin->request_filesystem_credentials();
		if ( ! $filesystem_access ) {
			return array(
				'success' => false,
				'message' => esc_html__( 'Cannot install QuillCRM Pro plugin automatically, please download it and install it manually', 'quill-crm' ),
			);
		}

		// install the plugin plugin.
		$installer->install( $download_link );

		// check wp_error.
		if ( is_wp_error( $installer_skin->result ) ) {
		

			// quillbooking_get_logger()->error(
			// 	esc_html__( 'Cannot install QuillCRM Pro plugin plugin', 'quill-crm' ),
			// 	array(
			// 		'code'        => 'cannot_install_plugin_plugin',
			// 		'plugin_slug' => $plugin_slug,
			// 		'error'       => array(
			// 			'code'    => $installer_skin->result->get_error_code(),
			// 			'message' => $installer_skin->result->get_error_message(),
			// 			'data'    => $installer_skin->result->get_error_data(),
			// 		),
			// 	)
			// );
			return array(
				'success' => false,
				'message' => esc_html__( 'Cannot install QuillCRM Pro plugin, check log for details', 'quill-crm' ),
			);
		}

		// check failed installation.
		if ( ! $installer_skin->result || ! $installer->plugin_info() ) {
			// quillbooking_get_logger()->error(
			// 	esc_html__( 'Cannot install QuillCRM Pro plugin plugin', 'quill-crm' ),
			// 	array(
			// 		'code'             => 'cannot_install_plugin_plugin',
			// 		'plugin_slug'      => $plugin_slug,
			// 		'upgrade_messages' => $installer_skin->get_upgrade_messages(),
			// 	)
			// );
			return array(
				'success' => false,
				'message' => esc_html__( 'Cannot install QuillCRM Pro plugin, check log for details', 'quill-crm' ),
			);
		}

		// check the installed plugin.
		if ( $installer->plugin_info() !== $this->plugin_data['plugin_file'] ) {

			if ( ! function_exists( 'delete_plugins' ) ) {
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
			}
			$removed = delete_plugins( array( $installer->plugin_info() ) );
			// quillbooking_get_logger()->critical(
			// 	esc_html__( 'Invalid QuillCRM Pro plugin installation detected', 'quill-crm' ),
			// 	array(
			// 		'code'                  => 'invalid_plugin_installation',
			// 		'plugin_slug'           => $plugin_slug,
			// 		'plugin_file'           => $this->plugin_data['plugin_file'],
			// 		'installer_plugin_info' => $installer->plugin_info(),
			// 		'removed'               => $removed,
			// 		'upgrade_messages'      => $installer_skin->get_upgrade_messages(),
			// 	)
			// );
			return array(
				'success' => false,
				'message' => esc_html__( 'Cannot install QuillCRM Pro plugin, check log for details', 'quill-crm' ),
			);
		}

		// log successful installation.
		// quillbooking_get_logger()->info(
		// 	esc_html__( 'QuillCRM Pro plugin installed successfully', 'quill-crm' ),
		// 	array(
		// 		'code'             => 'plugin_installed_successfully',
		// 		'plugin_slug'      => $this->plugin_data['slug'],
		// 		'upgrade_messages' => $installer_skin->get_upgrade_messages(),
		// 	)
		// );
		return array(
			'success' => true,
			'message' => esc_html__( 'QuillCRM Pro plugin installed successfully', 'quill-crm' ),
		);
	}

	/**
	 * Define plans
	 *
	 * @since 1.6.0
	 *
	 * @return void
	 */
	private function define_plans() {
		$this->plans = array(
			'basic'      => array(
				'label' => esc_html__( 'Basic', 'quill-crm' ),
			),
			'plus'       => array(
				'label' => esc_html__( 'Plus', 'quill-crm' ),
			),
			'enterprise' => array(
				'label' => esc_html__( 'Enterprise', 'quill-crm' ),
			),
			'basic-ltd' => array(
				'label' => esc_html__( 'Basic LTD', 'quill-crm' ),
			),
			'plus-ltd'  => array(
				'label' => esc_html__( 'Plus LTD', 'quill-crm' ),
			),
			'enterprise-ltd' => array(
				'label' => esc_html__( 'Enterprise LTD', 'quill-crm' ),
			),
		);
	}

	/**
	 * Get plans
	 *
	 * @since 1.6.0
	 *
	 * @return array
	 */
	public function get_plans() {
		return $this->plans;
	}

	/**
	 * Get plan label
	 *
	 * @since 1.6.0
	 *
	 * @param string $plan Plan key.
	 * @return string|null
	 */
	public function get_plan_label( $plan ) {
		if ( isset( $this->plans[ $plan ] ) ) {
			return $this->plans[ $plan ]['label'];
		} else {
			return null;
		}
	}

	/**
	 * Get current license info
	 *
	 * @since 1.6.0
	 *
	 * @param boolean $include_key Whether to include key or not.
	 * @return array|false
	 */
	public function get_license_info( $include_key = false ) {
		$license = get_option( 'quillcrm_license' );
		if ( empty( $license ) ) {
			return null;
		} else {
			// add labels.
			$license['status_label'] = $this->get_status_label( $license['status'] );
			$license['plan_label']   = $this->get_plan_label( $license['plan'] );
			foreach ( array_keys( $license['upgrades'] ) as $upgrade_plan ) {
				$license['upgrades'][ $upgrade_plan ]['plan_label'] = $this->get_plan_label( $upgrade_plan );
			}
			// convert gmt dates to local.
			foreach ( array( 'expires', 'last_update', 'last_check' ) as $key ) {
				$license[ $key ] = get_date_from_gmt( $license[ $key ] );
			}
			// maybe remove plan key.
			if ( ! $include_key ) {
				unset( $license['key'] );
			}
			return $license;
		}
	}

	/**
	 * Update license
	 *
	 * @since 1.6.0
	 *
	 * @return array
	 */
	public function update_license() {
		// check current license.
		$license = get_option( 'quillcrm_license' );
		if ( empty( $license['key'] ) ) {
			return array(
				'success' => false,
				'message' => esc_html__( 'No license key found', 'quill-crm' ),
			);
		}

		$response = Site::instance()->api_request(
			array(
				'edd_action' => 'check_license',
				'license'    => $license['key'],
				'item_id'    => 'plan',
			)
		);

		// failed request.
		if ( ! $response['success'] ) {
			// update last check only.
			$license['last_check'] = gmdate( 'Y-m-d H:i:s' );
			update_option( 'quillcrm_license', $license );
	
			$message = $response['message'] ?? esc_html__( 'An error occurred, please try again', 'quill-crm' );
			return array(
				'success' => false,
				'message' => $message,
			);
		}

		if ( ! empty( $response['data']['plan'] ) ) {
			$license_status = $response['data']['license'];
			$license_plan   = $response['data']['plan'];
		} else {  // empty plan, shouldn't be reached normally.
			$license_status = 'item_name_mismatch';
			$license_plan   = null;
		}

		// new license data.
		$license = array(
			'status'      => $license_status,
			'plan'        => $license_plan,
			'key'         => $license['key'],
			'expires'     => $response['data']['expires'] ?? null,
			'upgrades'    => $response['data']['upgrades'] ?? array(),
			'last_update' => gmdate( 'Y-m-d H:i:s' ),
			'last_check'  => gmdate( 'Y-m-d H:i:s' ),
		);

		// update option.
		update_option( 'quillcrm_license', $license );

		return array( 'success' => true );
	}

	/**
	 * Initialize and handle license update task.
	 *
	 * @since 1.6.0
	 *
	 * @return void
	 */
	public function license_update_task() {
		// schedule task.
		add_action(
			'init',
			function() {
				if ( QuillCRM::instance()->daily_tasks->get_next_timestamp( 'license_update' ) === false ) {
					QuillCRM::instance()->daily_tasks->schedule_recurring(
						time(),
						DAY_IN_SECONDS,
						'license_update'
					);
				}
			}
		);

		// scheduled task callback.
		QuillCRM::instance()->daily_tasks->register_callback(
			'license_update',
			array( $this, 'handle_license_update_task' )
		);

		// direct update in case of overdue.
		if ( is_admin() ) {
			$license = get_option( 'quillcrm_license' );
			if ( $license && ! empty( $license['last_check'] ) && strtotime( $license['last_check'] ) < time() - 5 * DAY_IN_SECONDS ) {
				$this->handle_license_update_task( 'direct' );
			}
		}
	}

	/**
	 * Handle license update task callback
	 *
	 * @since 1.6.0
	 *
	 * @param string $trigger Trigger.
	 * @return void
	 */
	public function handle_license_update_task( $trigger = 'cron' ) {
		if ( get_option( 'quillcrm_license' ) !== false ) {
			$result = $this->update_license();

			if ( $result['success'] ) {
				// quillbooking_get_logger()->debug(
				// 	esc_html__( 'License update task done', 'quill-crm' ),
				// 	array(
				// 		'code'    => 'license_update_task_done',
				// 		'trigger' => $trigger,
				// 	)
				// );
			} else {
				// quillbooking_get_logger()->warning(
				// 	esc_html__( 'License update task failed', 'quill-crm' ),
				// 	array(
				// 		'code'    => 'license_update_task_failed',
				// 		'trigger' => $trigger,
				// 	)
				// );
			}
		}
	}

	/**
	 * Handle activate request
	 *
	 * @since 1.6.0
	 *
	 * @return void
	 */
	public function ajax_activate() {
		$this->check_authorization();

		// check current license.
		if ( ! empty( get_option( 'quillcrm_license' ) ) ) {
			wp_send_json_error( esc_html__( 'Current license must be deactivated first', 'quill-crm' ), 403 );
			exit;
		}

		// posted license key.
		$license_key = trim( sanitize_text_field( $_POST['license_key'] ?? '' ) );
		if ( empty( $license_key ) ) {
			wp_send_json_error( esc_html__( 'License key is required', 'quill-crm' ), 400 );
			exit;
		}

		$response = Site::instance()->api_request(
			array(
				'edd_action' => 'activate_license',
				'license'    => $license_key,
				'item_id'    => 'plan',
			)
		);

		// failed request.
		if ( ! $response['success'] ) {
			$message = $response['message'] ?? esc_html__( 'An error occurred, please try again', 'quill-crm' );
			wp_send_json_error( $message, 422 );
			exit;
		}

		// api request error.
		if ( ! ( $response['data']['success'] ?? false ) ) {
			$status_label = $this->get_status_label( $response['data']['error'] ?? null );
			if ( $status_label ) {
				$message = esc_html__( 'License error', 'quill-crm' ) . ": $status_label";
			} else {
				$message = esc_html__( 'An error occurred, please try again', 'quill-crm' );
			}
	
			wp_send_json_error( $message, 422 );
			exit;
		}

		if ( 'valid' !== $response['data']['license'] ) {
			$message = esc_html__( 'Invalid license', 'quill-crm' );
			wp_send_json_error( $message, 422 );
			exit;
		}

		if ( empty( $response['data']['plan'] ) ) {
			$message = esc_html__( 'Server error, please contact the support', 'quill-crm' );
			wp_send_json_error( $message, 422 );
			exit;
		}

		// new license data.
		$license = array(
			'status'      => 'valid',
			'plan'        => $response['data']['plan'],
			'key'         => $license_key,
			'expires'     => $response['data']['expires'],
			'upgrades'    => $response['data']['upgrades'] ?? array(),
			'last_update' => gmdate( 'Y-m-d H:i:s' ),
			'last_check'  => gmdate( 'Y-m-d H:i:s' ),
		);

		// update option.
		update_option( 'quillcrm_license', $license );

		// return new license info.
		wp_send_json_success( $this->get_license_info(), 200 );
	}

	/**
	 * Handle update request
	 *
	 * @since 1.6.0
	 *
	 * @return void
	 */
	public function ajax_update() {
		$this->check_authorization();

		$update = $this->update_license();
		if ( $update['success'] ) {
			wp_send_json_success( $this->get_license_info(), 200 );
		} else {
			wp_send_json_error( $update['message'] );
		}
	}

	/**
	 * Handle deactivate request
	 *
	 * @since 1.6.0
	 *
	 * @return void
	 */
	public function ajax_deactivate() {
		$this->check_authorization();

		// check current license.
		$license = get_option( 'quillcrm_license' );
		if ( ! empty( $license['key'] ) ) {
			Site::instance()->api_request(
				array(
					'edd_action' => 'deactivate_license',
					'license'    => $license['key'],
					'item_id'    => 'plan',
				)
			);

			delete_option( 'quillcrm_license' );
		}

		wp_send_json_success( esc_html__( 'License removed successfully', 'quill-crm' ), 200 );
	}

	/**
	 * Get translated status label
	 *
	 * @since 1.6.0
	 *
	 * @param string $status Status key.
	 * @return string|null
	 */
	public function get_status_label( $status ) {
		switch ( $status ) {
			case 'valid':
				return esc_html__( 'Valid', 'quill-crm' );

			case 'expired':
				return esc_html__( 'Expired', 'quill-crm' );

			case 'disabled':
			case 'revoked':
				return esc_html__( 'Disabled', 'quill-crm' );

			case 'missing':
			case 'invalid':
				return esc_html__( 'Invalid', 'quill-crm' );

			case 'inactive':
			case 'site_inactive':
				return esc_html__( 'Not active for this website', 'quill-crm' );

			case 'item_name_mismatch':
				return esc_html__( 'Invalid key for a plan', 'quill-crm' );

			case 'no_activations_left':
				return esc_html__( 'Key reached its activation limit', 'quill-crm' );

			default:
				return null;
		}
	}

	/**
	 * Check ajax request authorization.
	 * Sends error response and exit if not authorized.
	 *
	 * @since 1.6.0
	 *
	 * @return void
	 */
	private function check_authorization() {
		// check for valid nonce field.
		if ( ! check_ajax_referer( 'quillcrm-admin', '_nonce', false ) ) {
			wp_send_json_error( esc_html__( 'Invalid nonce', 'quill-crm' ), 403 );
			exit;
		}

		// check for user capability.
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( esc_html__( 'Forbidden', 'quill-crm' ), 403 );
			exit;
		}
	}

}