<?php
/**
 * Manager for Importers
 *
 * This class is responsible for handling the Importers
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Contacts\ImportExport\Importers;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use DoubleScale\Modules\Contacts\Abstracts\Importer;
use DoubleScale\Modules\Contacts\ImportExport\Importers\Fluentcrm;
use DoubleScale\Modules\Contacts\ImportExport\Importers\Funnelkit;
use DoubleScale\Modules\Contacts\ImportExport\Importers\Csv;
use DoubleScale\Modules\Contacts\ImportExport\Importers\Wpusers;
use DoubleScale\Modules\Contacts\ImportExport\Importers\WcCustomers;
use DoubleScale\Modules\Contacts\ImportExport\Importers\Memberpress;
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
		add_action( 'doublescale_loaded', array( $this, 'register_importers' ) );
	}

	/**
	 * Register the importers
	 */
	public function register_importers() {
		$importers = array(
			new Fluentcrm(),
			new Funnelkit(),
			new Csv(),
			new Wpusers(),
			new WcCustomers(),
			new Memberpress(),
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
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception message, not direct output.
			throw new \Exception( __( 'Importer not found', 'doublescale') );
		}

		return $this->importers[ $slug ];
	}
}
