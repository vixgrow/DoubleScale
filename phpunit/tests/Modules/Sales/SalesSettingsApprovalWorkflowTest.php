<?php
/**
 * Sales settings approval workflow toggle.
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

use DoubleScale\Modules\Sales\Services\SalesSettings;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class SalesSettingsApprovalWorkflowTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		delete_option( 'doublescale_sales_settings' );
	}

	protected function tearDown(): void {
		delete_option( 'doublescale_sales_settings' );
		parent::tearDown();
	}

	public function test_approval_workflow_defaults_to_disabled(): void {
		$this->assertFalse( SalesSettings::get( 'approval_workflow_enabled', false ) );

		$all = SalesSettings::get_all();
		$this->assertArrayHasKey( 'approval_workflow_enabled', $all );
		$this->assertFalse( $all['approval_workflow_enabled'] );
	}

	public function test_approval_workflow_toggle_persists(): void {
		SalesSettings::update( array( 'approval_workflow_enabled' => true ) );

		$this->assertTrue( SalesSettings::get( 'approval_workflow_enabled' ) );
		$this->assertTrue( SalesSettings::get_all()['approval_workflow_enabled'] );
	}

	/**
	 * @dataProvider provide_bool_round_trip
	 */
	public function test_approval_workflow_bool_sanitization( $input, bool $expected ): void {
		SalesSettings::update( array( 'approval_workflow_enabled' => $input ) );
		$this->assertSame( $expected, SalesSettings::get( 'approval_workflow_enabled' ) );
	}

	/**
	 * @return array<string, array{0: mixed, 1: bool}>
	 */
	public static function provide_bool_round_trip(): array {
		return array(
			'true'        => array( true, true ),
			'false'       => array( false, false ),
			'truthy int'  => array( 1, true ),
			'falsy int'   => array( 0, false ),
			'truthy str'  => array( 'yes', true ),
			'empty str'   => array( '', false ),
		);
	}
}
