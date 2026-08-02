<?php
/**
 * Unit coverage for the workflow export / import portability service.
 *
 * The fast test suite has no WordPress database (see CLAUDE.md), so this
 * focuses on the parts that need none: the import envelope-validation guards
 * (which return before any model touch) and the pure settings-transform
 * helpers that do the cross-site portability work.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Automations;

require_once __DIR__ . '/../../../RestApiEndpointTestStubs.php';

use DoubleScale\Modules\Automations\Services\WorkflowPortabilityManager;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * @group smoke
 */
class WorkflowPortabilityTest extends TestCase {

	/**
	 * instance() returns a shared singleton, matching the other *Manager services.
	 */
	public function test_instance_is_singleton(): void {
		$this->assertSame(
			WorkflowPortabilityManager::instance(),
			WorkflowPortabilityManager::instance()
		);
	}

	/**
	 * The envelope marker and format version are stable contract values.
	 */
	public function test_envelope_constants(): void {
		$this->assertSame( '_doublescale_workflow', WorkflowPortabilityManager::ENVELOPE_KEY );
		$this->assertSame( '_doublescale_workflows', WorkflowPortabilityManager::BULK_ENVELOPE_KEY );
		$this->assertSame( 1, WorkflowPortabilityManager::FORMAT_VERSION );
	}

	/**
	 * A non-array payload is rejected before any database work.
	 */
	public function test_import_rejects_non_array_payload(): void {
		$result = WorkflowPortabilityManager::instance()->import( 'not-an-array' );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_workflow_file', $result->get_error_code() );
	}

	/**
	 * A payload missing the envelope marker is treated as a foreign file.
	 */
	public function test_import_rejects_missing_envelope_marker(): void {
		$result = WorkflowPortabilityManager::instance()->import(
			array(
				'workflow' => array(
					'automation' => array( 'trigger' => 'contact_created' ),
					'steps'      => array(),
				),
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_workflow_file', $result->get_error_code() );
	}

	/**
	 * A workflow with no trigger cannot be imported.
	 */
	public function test_import_rejects_missing_trigger(): void {
		$result = WorkflowPortabilityManager::instance()->import(
			array(
				WorkflowPortabilityManager::ENVELOPE_KEY => true,
				'format_version'                         => 1,
				'workflow'                               => array(
					'automation' => array( 'name' => 'No trigger' ),
					'steps'      => array(),
				),
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'invalid_workflow_file', $result->get_error_code() );
	}

	/**
	 * A file from a newer plugin (higher format version) is refused rather than
	 * silently mis-parsed.
	 */
	public function test_import_rejects_newer_format_version(): void {
		$result = WorkflowPortabilityManager::instance()->import(
			array(
				WorkflowPortabilityManager::ENVELOPE_KEY => true,
				'format_version'                         => WorkflowPortabilityManager::FORMAT_VERSION + 1,
				'workflow'                               => array(
					'automation' => array( 'trigger' => 'contact_created' ),
					'steps'      => array(),
				),
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'unsupported_workflow_version', $result->get_error_code() );
	}

	/**
	 * strip_bookkeeping() removes the editor's transient keys while preserving the
	 * real, portable settings.
	 */
	public function test_strip_bookkeeping_removes_transient_keys(): void {
		$method = new ReflectionMethod( WorkflowPortabilityManager::class, 'strip_bookkeeping' );
		$method->setAccessible( true );

		$cleaned = $method->invoke(
			WorkflowPortabilityManager::instance(),
			array(
				'_version_cursor'         => 42,
				'_trigger_label'          => 'Contact created',
				'_action_warning'         => true,
				'_action_warning_message' => 'Requires Pro',
				'_goal_label'             => 'Purchased',
				'tags'                    => array( 1, 2 ),
				'delay'                   => array( 'value' => 3 ),
			)
		);

		$this->assertSame(
			array(
				'tags'  => array( 1, 2 ),
				'delay' => array( 'value' => 3 ),
			),
			$cleaned
		);
	}

	/**
	 * named_refs_to_ids() keeps bare numeric references intact (legacy / hand-edited
	 * files) without needing a database round-trip.
	 */
	public function test_named_refs_to_ids_passes_through_numeric_refs(): void {
		$method = new ReflectionMethod( WorkflowPortabilityManager::class, 'named_refs_to_ids' );
		$method->setAccessible( true );

		$ids = $method->invoke(
			WorkflowPortabilityManager::instance(),
			\DoubleScale\Modules\Contacts\Models\TagModel::class,
			array( 5, '7', 9 )
		);

		$this->assertSame( array( 5, 7, 9 ), $ids );
	}

	/**
	 * normalize_bulk_payload() unwraps a bulk envelope into single-workflow envelopes.
	 */
	public function test_normalize_bulk_payload_from_bulk_envelope(): void {
		$method = new ReflectionMethod( WorkflowPortabilityManager::class, 'normalize_bulk_payload' );
		$method->setAccessible( true );

		$single = array(
			WorkflowPortabilityManager::ENVELOPE_KEY => true,
			'workflow'                               => array(
				'automation' => array( 'name' => 'One' ),
				'steps'      => array(),
			),
		);

		$envelopes = $method->invoke(
			WorkflowPortabilityManager::instance(),
			array(
				WorkflowPortabilityManager::BULK_ENVELOPE_KEY => true,
				'workflows'                                   => array( $single ),
			)
		);

		$this->assertSame( array( $single ), $envelopes );
	}

	/**
	 * normalize_bulk_payload() accepts a plain list of single-workflow envelopes.
	 */
	public function test_normalize_bulk_payload_from_envelope_list(): void {
		$method = new ReflectionMethod( WorkflowPortabilityManager::class, 'normalize_bulk_payload' );
		$method->setAccessible( true );

		$single = array(
			WorkflowPortabilityManager::ENVELOPE_KEY => true,
			'workflow'                               => array(
				'automation' => array( 'name' => 'One' ),
				'steps'      => array(),
			),
		);

		$envelopes = $method->invoke(
			WorkflowPortabilityManager::instance(),
			array( $single )
		);

		$this->assertSame( array( $single ), $envelopes );
	}

	/**
	 * import_bulk() returns a structured error when no valid envelopes are found.
	 */
	public function test_import_bulk_rejects_invalid_payload(): void {
		$result = WorkflowPortabilityManager::instance()->import_bulk( 'not-an-array' );

		$this->assertSame( array(), $result['results'] );
		$this->assertCount( 1, $result['errors'] );
	}

	/**
	 * export_bulk() refuses when no workflows can be exported.
	 */
	public function test_export_bulk_rejects_empty_ids(): void {
		$result = WorkflowPortabilityManager::instance()->export_bulk( array() );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'workflow_export_failed', $result->get_error_code() );
	}
}
