<?php
/**
 * Manager for Importers
 *
 * This class is responsible for handling the Importers
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Import_Export\Importers;

use QuillCRM\Abstracts\Importer;
use QuillCRM\Import_Export\Importers\FluentCRM;
use QuillCRM\Import_Export\Importers\Funnelkit;
use QuillCRM\Import_Export\Importers\CSV;
use QuillCRM\Import_Export\Importers\WPUsers;
use QuillCRM\Import_Export\Importers\WC_Customers;
use QuillCRM\Import_Export\Importers\ActiveCampaign;
use QuillCRM\Import_Export\Importers\MailerLite;
use QuillCRM\Import_Export\Importers\HubSpot;
use QuillCRM\Import_Export\Importers\Pipedrive;
use Exception;

/**
 * Manager class
 */
class Manager {

	/**
	 * Importers
	 *
	 * @var Importer[]
	 */
	protected $importers = array();

	/**
	 * Options
	 *
	 * @var array
	 */
	protected $options = array();

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->init();
	}

	/**
	 * Initialize the class
	 */
	public function init() {
		add_action( 'quillcrm_loaded', array( $this, 'register_importers' ) );
	}

	/**
	 * Register the importers
	 */
	public function register_importers() {
		$importers = array(
			new FluentCRM(),
			new Funnelkit(),
			new CSV(),
			new WPUsers(),
			new WC_Customers(),
			new ActiveCampaign(),
			new MailerLite(),
			new HubSpot(),
			new Pipedrive(),
		);

		foreach ( $importers as $importer ) {
			$this->register_importer( $importer );
		}
	}

	/**
	 * Register the importer
	 *
	 * @param Importer $importer
	 */
	public function register_importer( $importer ) {
		if ( ! $importer instanceof Importer ) {
			return;
		}

		$this->importers[ $importer->slug ] = $importer;
		$this->options[ $importer->slug ]   = array(
			'name'           => $importer->name,
			'is_integration' => $importer->is_integration(),
			'credentials'    => $importer->get_credentials(),
			'is_active'      => $importer->is_active(),
			'fields'         => ! $importer->is_integration() ? $importer->get_fields() : array(),
		);
	}

	/**
	 * Get the importers
	 *
	 * @return Importer[]
	 */
	public function get_importers() {
		return $this->importers;
	}

	/**
	 * Get the options
	 *
	 * @return array
	 */
	public function get_options() {
		return $this->options;
	}

	/**
	 * Get the importer
	 *
	 * @param string $slug
	 *
	 * @throws Exception
	 * @return Importer
	 */
	public function get_importer( $slug ) {
		if ( ! isset( $this->importers[ $slug ] ) ) {
			throw new \Exception( __( 'Importer not found', 'quillcrm' ) );
		}

		return $this->importers[ $slug ];
	}
}
