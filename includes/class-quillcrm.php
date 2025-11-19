<?php

/**
 * Main class: class QuillCRM
 *
 * @since   1.0.0
 * @package QuillCRM
 */

namespace QuillCRM;

use QuillCRM\REST_API\REST_API;
use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Events\Dispatcher;
use Illuminate\Container\Container;
use QuillCRM\Tasks;
use QuillCRM\Campaign\Email_Processing;
// use QuillCRM\Campaign\SMS_Processing; // Moved to Pro
// use QuillCRM\Campaign\WhatsApp_Processing; // Moved to Pro
use QuillCRM\Tracking\Email as Email_Tracking;
// use QuillCRM\Tracking\SMS as SMS_Tracking; // Moved to Pro
// use QuillCRM\Tracking\WhatsApp as WhatsApp_Tracking; // Moved to Pro
use QuillCRM\Managers\Forms_Manager;
use QuillCRM\Managers\Triggers_Manager;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Managers\Bounce_Handler_Manager;
use QuillCRM\Automations\Loader as Automations_Loader;
use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Tracking\Link_Triggers;
use QuillCRM\Subscription_Manage\Subscription_Manage;
use QuillCRM\Managers\Rules_Manager;
use QuillCRM\Admin\Admin;
use QuillCRM\Admin\Admin_Loader;
use QuillCRM\Abandoned_Cart\Abandoned_Cart;
use QuillCRM\Managers\Custom_Fields_Manager;
use QuillCRM\Managers\Filters_Manager;
use QuillCRM\Import_Export\Importers\Manager as Importers_Manager;
use QuillCRM\Managers\Email_Sequences_Manager;
use Illuminate\Translation\Translator;
use Illuminate\Translation\ArrayLoader;
use Illuminate\Validation\Factory as ValidatorFactory;
use QuillCRM\Custom_Metabox;
use QuillCRM\Log_Handlers\Log_Handler_DB;
use QuillCRM\Emails\Email_Builder;
use QuillCRM\User_Roles\User_Roles;
use QuillCRM\Automations\Integrations\GoHighLevel\GoHighLevel_OAuth;
// use QuillCRM\Managers\Message_Provider_Registry; // Moved to Pro
// use QuillCRM\Message_Providers\Twilio_Message_Provider; // Moved to Pro


/**
 * QuillCRM Main Class.
 * The main class that's responsible for loading all dependencies
 *
 * @since 1.0.0
 */
final class QuillCRM {



















	/**
	 * Campaigns tasks
	 *
	 * @var Tasks
	 */
	private $campaigns_tasks;

	/**
	 * Automations tasks
	 *
	 * @var Tasks
	 */
	private $automations_tasks;

	/**
	 * Daily tasks
	 *
	 * @var Tasks
	 */
	private $daily_tasks;

	/**
	 * Abandoned cart tasks
	 *
	 * @var Tasks
	 */
	private $abandoned_cart_tasks;

	/**
	 * Validator
	 *
	 * @var ValidatorFactory
	 */
	private $validator;

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
		$this->init_illuminate();
		$this->load_dependencies();
		$this->init_objects();
		$this->init_hooks();
		add_action( 'init', array( $this, 'register_tasks' ) );
	}

	/**
	 * Register tasks
	 *
	 * @since 1.0.0
	 */
	public function register_tasks() {
		if ( $this->campaigns_tasks->get_next_timestamp( 'quillcrm_email_campaigns' ) === false ) {
			$this->campaigns_tasks->schedule_recurring( time(), 60, 'quillcrm_email_campaigns' );
		}

		// SMS campaigns moved to Pro - scheduling handled by Pro plugin
		// if ( $this->campaigns_tasks->get_next_timestamp( 'quillcrm_sms_campaigns' ) === false ) {
		// $this->campaigns_tasks->schedule_recurring( time(), 60, 'quillcrm_sms_campaigns' );
		// }

		// WhatsApp campaigns moved to Pro - scheduling handled by Pro plugin
		// if ( $this->campaigns_tasks->get_next_timestamp( 'quillcrm_whatsapp_campaigns' ) === false ) {
		// $this->campaigns_tasks->schedule_recurring( time(), 60, 'quillcrm_whatsapp_campaigns' );
		// }

		if ( $this->campaigns_tasks->get_next_timestamp( 'quillcrm_email_sequences' ) === false ) {
			$this->campaigns_tasks->schedule_recurring( time(), 60, 'quillcrm_email_sequences' );
		}

		if ( $this->daily_tasks->get_next_timestamp( 'quillcrm_daily3' ) === false ) {
			$this->daily_tasks->schedule_recurring( time(), DAY_IN_SECONDS, 'quillcrm_daily3' );
		}

		if ( $this->daily_tasks->get_next_timestamp( 'quillcrm_daily4' ) === false ) {
			$this->daily_tasks->schedule_recurring( time(), DAY_IN_SECONDS, 'quillcrm_daily4' );
		}
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
		global $wpdb;

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
				'prefix'    => $wpdb->prefix,
			)
		);

		$capsule->setEventDispatcher( new Dispatcher( new Container() ) );

		$capsule->setAsGlobal();

		$capsule->bootEloquent();

		$translator      = new Translator( new ArrayLoader(), 'en' );
		$this->validator = new ValidatorFactory( $translator );
	}

	/**
	 * Initialize instances from classes loaded.
	 *
	 * @since 1.0.0
	 */
	private function init_objects() {
		$this->campaigns_tasks      = new Tasks( 'quillcrm_campaigns' );
		$this->automations_tasks    = new Tasks( 'quillcrm_automations' );
		$this->daily_tasks          = new Tasks( 'quillcrm_daily' );
		$this->abandoned_cart_tasks = new Tasks( 'quillcrm_abandoned_cart' );

		Custom_Fields_Manager::instance();
		Admin::instance();
		Admin_Loader::instance();
		REST_API::instance();
		Email_Processing::instance();
		// SMS_Processing::instance(); // Moved to Pro
		// WhatsApp_Processing::instance(); // Moved to Pro
		Email_Tracking::instance();
		// SMS_Tracking::instance(); // Moved to Pro
		// WhatsApp_Tracking::instance(); // Moved to Pro
		Link_Triggers::instance();
		Subscription_Manage::instance();
		Forms_Manager::instance();
		Triggers_Manager::instance();
		Actions_Manager::instance();
		Automations_Loader::instance();
		Merge_Tags_Manager::instance();
		Rules_Manager::instance();
		Abandoned_Cart::instance();
		Filters_Manager::instance();
		Importers_Manager::instance();
		Custom_Metabox::get_instance();
		Email_Builder::instance();
		GoHighLevel_OAuth::init();
		// Pipeline, Deal, and Activity managers moved to Pro plugin
		Email_Sequences_Manager::instance();
		User_Roles::instance();
		Bounce_Handler_Manager::instance();
	}

	/**
	 * Initialize hooks
	 *
	 * @since 1.0.0
	 */
	private function init_hooks() {
		 // Register log handlers.
		add_filter( 'quillcrm_register_log_handlers', array( $this, 'register_log_handlers' ) );

		// Register message providers - Moved to Pro
		// add_action( 'quillcrm_loaded', array( $this, 'register_message_providers' ) );

		// Register contact meta table
		add_action( 'init', array( $this, 'register_contact_meta_table' ) );
	}

	/**
	 * Register contact meta table
	 *
	 * @since 1.0.0
	 */
	public function register_contact_meta_table() {
		 global $wpdb;
		$wpdb->contactmeta = $wpdb->prefix . 'quillcrm_contact_meta';

		// Register meta type with WordPress so add_metadata/get_metadata work correctly.
		// This is the modern way to register a custom meta table with WordPress.
		add_filter(
			'get_meta_table',
			function ( $table, $meta_type ) {
				global $wpdb;
				if ( 'contact' === $meta_type ) {
					return $wpdb->contactmeta;
				}
				return $table;
			},
			10,
			2
		);
	}

	/**
	 * Load dependencies
	 *
	 * @since 1.0.0
	 */
	private function load_dependencies() {
		require QUILLCRM_PLUGIN_DIR . 'includes/functions.php';

		// Load message provider system - Moved to Pro
		// require QUILLCRM_PLUGIN_DIR . 'includes/interfaces/interface-message-provider.php';
		// require QUILLCRM_PLUGIN_DIR . 'includes/abstracts/class-abstract-message-provider.php';
		// require QUILLCRM_PLUGIN_DIR . 'includes/managers/class-message-provider-registry.php';
		// require QUILLCRM_PLUGIN_DIR . 'includes/message-providers/class-twilio-message-provider.php';

		// Load all integrations files
		$integrations_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/integrations/**/class-integration.php' );
		foreach ( $integrations_files as $file ) {
			require $file;
		}

		// Load all forms files
		$forms_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/forms/**/class-form.php' );
		foreach ( $forms_files as $file ) {
			require $file;
		}

		// Load all automations triggers files
		$triggers_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/triggers/class-*.php' );
		foreach ( $triggers_files as $file ) {
			require $file;
		}

		$triggers_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/triggers/woocommerce/**/class-*.php' );
		foreach ( $triggers_files as $file ) {
			require $file;
		}

		// Load all automations learndash triggers files
		// if ( quillcrm_is_plugin_active( 'sfwd-lms/sfwd_lms.php' ) ) {
		$triggers_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/triggers/learndash/class-*.php' );
		foreach ( $triggers_files as $file ) {
			require $file;
		}
		// }

		// Load all automations memberpress triggers files
		// if ( quillcrm_is_plugin_active( 'memberpress/memberpress.php' ) ) {
		$triggers_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/triggers/memberpress/class-*.php' );
		foreach ( $triggers_files as $file ) {
			require $file;
		}
		// }

		// Load all automations edd triggers files
		// if ( quillcrm_is_plugin_active( 'easy-digital-downloads/easy-digital-downloads.php' ) ) {
		$triggers_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/triggers/edd/class-*.php' );
		foreach ( $triggers_files as $file ) {
			require $file;
		}
		// }

		// Load all automations booking triggers files
		$triggers_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/triggers/booking/quillbooking/class-*.php' );
		foreach ( $triggers_files as $file ) {
			require $file;
		}

		// Deal triggers moved to Pro plugin
		$triggers_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/triggers/deal/class-*.php' );
		foreach ( $triggers_files as $file ) {
			require $file;
		}

		// Load all automations actions files
		$actions_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/actions/class-*.php' );
		foreach ( $actions_files as $file ) {
			require $file;
		}

		// Load all automations woocommerce actions files
		// if ( quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ) ) {
		$actions_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/actions/woocommerce/class-*.php' );
		foreach ( $actions_files as $file ) {
			require $file;
		}
		// }

		// Load all automations crm actions files
		// $actions_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/actions/crm/**/class-*.php' );
		// foreach ( $actions_files as $file ) {
		// require $file;
		// }

		// Load Slack actions files
		$actions_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/actions/crm/slack/class-*.php' );
		foreach ( $actions_files as $file ) {
			require $file;
		}

		// Load all automations learndash actions files
		// if ( quillcrm_is_plugin_active( 'sfwd-lms/sfwd_lms.php' ) ) {
		$actions_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/actions/learndash/class-*.php' );
		foreach ( $actions_files as $file ) {
			require $file;
		}
		// }

		// Load all automations email actions files
		$actions_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/actions/email/class-*.php' );
		foreach ( $actions_files as $file ) {
			require $file;
		}

		// Deal actions moved to Pro plugin
		// require_once QUILLCRM_PLUGIN_DIR . 'includes/automations/actions/deal/class-base-deal-action.php';
		// $actions_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/actions/deal/class-*.php' );
		// foreach ( $actions_files as $file ) {
		// if ( basename( $file ) !== 'class-base-deal-action.php' ) {
		// require $file;
		// }
		// }

		// Load all froms
		$merge_tags_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/merge-tags/forms/class-*.php' );
		foreach ( $merge_tags_files as $file ) {
			require $file;
		}

		// Load all learndash merge tags files
		$merge_tags_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/merge-tags/learndash/class-*.php' );
		foreach ( $merge_tags_files as $file ) {
			require $file;
		}

		// Load all learndash merge tags files
		$merge_tags_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/merge-tags/lms/learndash/class-*.php' );
		foreach ( $merge_tags_files as $file ) {
			require $file;
		}

		// Load all contact merge tags files
		$merge_tags_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/merge-tags/contact/class-*.php' );
		foreach ( $merge_tags_files as $file ) {
			require $file;
		}

		// Load all general merge tags files
		$merge_tags_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/merge-tags/general/class-*.php' );
		foreach ( $merge_tags_files as $file ) {
			require $file;
		}

		// Load all order merge tags files
		$merge_tags_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/merge-tags/woocommerce/**/class-*.php' );
		foreach ( $merge_tags_files as $file ) {
			require $file;
		}

		// Load all order merge tags files
		$merge_tags_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/merge-tags/edd/**/class-*.php' );
		foreach ( $merge_tags_files as $file ) {
			require $file;
		}

		// Load contact rules files
		$rules_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/rules/**/class-*.php' );
		foreach ( $rules_files as $file ) {
			require $file;
		}

		// Load all automations goals files
		$goals_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/automations/goals/class-*.php' );
		foreach ( $goals_files as $file ) {
			require $file;
		}

		// Load all custom fields types files
		$custom_fields_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/fields/types/class-*.php' );
		foreach ( $custom_fields_files as $file ) {
			require $file;
		}

		// Load all custom filters files
		$filters_files = glob( QUILLCRM_PLUGIN_DIR . 'includes/contact-filters/**/class-*.php' );
		foreach ( $filters_files as $file ) {
			require $file;
		}
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

	/**
	 * Register log handlers
	 *
	 * @param  array $handlers Handlers array to filter.
	 * @return array
	 */
	public function register_log_handlers( $handlers ) {
		$handlers[] = new Log_Handler_DB();
		return $handlers;
	}
}
