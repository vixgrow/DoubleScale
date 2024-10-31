<?php
/**
 * CSV Importer
 *
 * This class is responsible for handling the CSV importer
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Import_Export\Importers;

use QuillCRM\Abstracts\Importer;
use League\Csv\Reader;
use League\Csv\Statement;

/**
 * CSV Importer class
 */
class CSV extends Importer {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'CSV';

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
		$mapping = array_flip( $this->mapping );
		if ( ! isset( $mapping['email'] ) || empty( $mapping['email'] ) ) {
			throw new \Exception( __( 'Email field is required.', 'quillcrm' ) );
		}

		$file_path = wp_upload_dir()['basedir'] . '/QuillCRM/Import-Export/' . $this->file_name;
		$csv       = Reader::createFromPath( $file_path, 'r' );
		$csv->setHeaderOffset( 0 );
		$total = count( $csv );

		$result = $this->import_with_offset(
			$total,
			$this->offset,
			function( $offset ) use ( $csv ) {
				$stmt        = ( new Statement() )->offset( $offset )->limit( 20 );
				$subscribers = $stmt->process( $csv );
				return $subscribers;
			},
			$mapping
		);

		if ( 'completed' === $result['status'] ) {
			unlink( $file_path );
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
				'label'      => __( 'File Name', 'quillcrm' ),
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
				'label'      => __( 'Mapping', 'quillcrm' ),
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
