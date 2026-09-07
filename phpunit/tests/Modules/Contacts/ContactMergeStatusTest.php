<?php
/**
 * Deterministic channel-status merge helpers.
 *
 * @package DoubleScale\Tests\Modules\Contacts
 */

namespace DoubleScale\Tests\Modules\Contacts;

use DoubleScale\Modules\Contacts\Services\ContactMergeService;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class ContactMergeStatusTest extends TestCase {

	public function test_restrictive_status_outranks_subscribed(): void {
		$this->assertGreaterThan(
			ContactMergeService::status_rank( 'subscribed' ),
			ContactMergeService::status_rank( 'unsubscribed' )
		);
		$this->assertGreaterThan(
			ContactMergeService::status_rank( 'unsubscribed' ),
			ContactMergeService::status_rank( 'bounced' )
		);
		$this->assertGreaterThan(
			ContactMergeService::status_rank( 'bounced' ),
			ContactMergeService::status_rank( 'blocked' )
		);
	}

	public function test_merge_status_keeps_the_more_restrictive_value(): void {
		$this->assertSame(
			'unsubscribed',
			ContactMergeService::merge_status( 'subscribed', 'unsubscribed' )
		);
		$this->assertSame(
			'bounced',
			ContactMergeService::merge_status( 'unsubscribed', 'bounced' )
		);
		$this->assertSame(
			'blocked',
			ContactMergeService::merge_status( 'subscribed', 'blocked' )
		);
		$this->assertSame(
			'subscribed',
			ContactMergeService::merge_status( 'subscribed', 'subscribed' )
		);
	}

	public function test_empty_values(): void {
		$this->assertTrue( ContactMergeService::is_empty_value( null ) );
		$this->assertTrue( ContactMergeService::is_empty_value( '' ) );
		$this->assertTrue( ContactMergeService::is_empty_value( '   ' ) );
		$this->assertFalse( ContactMergeService::is_empty_value( 'kept' ) );
		$this->assertFalse( ContactMergeService::is_empty_value( 0 ) );
	}
}
