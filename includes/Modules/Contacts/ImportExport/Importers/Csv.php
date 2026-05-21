<?php
/**
 * Csv Importer
 *
 * This class is responsible for handling the Csv importer
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Contacts\ImportExport\Importers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Contacts\Abstracts\Importer;
use League\Csv\Reader;
use League\Csv\Statement;
use DoubleScale\Modules\Contacts\ImportExport\Security;

/**
 * Csv Importer class
 */
class Csv extends Importer {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Csv';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'csv';

	/**
	 * Is Integration
	 *
	 * @var bool
	 */
	protected $is_integration = false;

	/**
	 * Mapping
	 *
	 * @var array
	 */
	protected $mapping;

	/**
	 * File name
	 *
	 * @var string
	 */
	protected $file_name;

	/**
	 * Constructor
	 *
	 * @param array $args args
	 */
	public function __construct( $args = array() ) {
		parent::__construct( $args );

		$this->mapping   = $args['mapping'] ?? array();
		$this->file_name = $args['file_name'] ?? '';
	}

	/**
	 * Run importer
	 */
	public function run() {
		if ( ! Security::prepare_upload_dir() ) {
			throw new \Exception( esc_html__( 'Could not create the import working directory.', 'doublescale' ) );
		}

		$mapping = array_flip( $this->mapping );
		if ( ! isset( $mapping['email'] ) || empty( $mapping['email'] ) ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception message, not direct output.
			throw new \Exception( esc_html__( 'Email field is required.', 'doublescale' ) );
		}

		$file_path = Security::get_upload_file_path( $this->file_name );
		$csv       = Reader::createFromPath( $file_path, 'r' );
		$csv->setHeaderOffset( 0 );
		$total = count( $csv );

		$result = $this->import_with_offset(
			$total,
			$this->offset,
			function ( $offset ) use ( $csv ) {
				$stmt        = ( new Statement() )->offset( $offset )->limit( 20 );
				$subscribers = $stmt->process( $csv );
				return $subscribers;
			},
			$mapping
		);

		if ( 'completed' === $result['status'] ) {
			wp_delete_file( $file_path );
		}

		return $result;
	}

	/**
	 * Get fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'file_name' => array(
				'label'      => __( 'File Name', 'doublescale' ),
				'type'       => 'file',
				'conditions' => array(
					'relation' => 'and',
					'rules'    => array(
						array(
							'field'    => 'file_name',
							'operator' => 'empty',
						),
					),
				),
			),
			'mapping'   => array(
				'label'      => __( 'Mapping', 'doublescale' ),
				'type'       => 'contact_mapped_fields',
				'conditions' => array(
					'relation' => 'and',
					'rules'    => array(
						array(
							'field'    => 'file_name',
							'operator' => 'not_empty',
						),
					),
				),
			),
		);
	}
}
