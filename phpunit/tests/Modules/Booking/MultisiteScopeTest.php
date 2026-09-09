<?php
/**
 * Booking multisite scoping helpers.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Booking;

use DoubleScale\Modules\Booking\Helpers\MultisiteScope;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
class MultisiteScopeTest extends TestCase {

	protected function tearDown(): void {
		MultisiteScope::reset_cache_for_tests();
		parent::tearDown();
	}

	public function test_is_not_active_on_single_site_bootstrap(): void {
		$this->assertFalse( MultisiteScope::is_active() );
	}

	public function test_member_checks_are_permissive_when_not_multisite(): void {
		$this->assertTrue( MultisiteScope::is_member( 42 ) );
		$this->assertSame( array(), MultisiteScope::member_user_ids() );
	}
}
