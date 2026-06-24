<?php
/**
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Activities\Models;

use DoubleScale\Modules\Activities\Models\ActivityModel;
use PHPUnit\Framework\TestCase;

final class ActivityModelEmailSourceTest extends TestCase {

	public function test_is_manual_email_log_with_explicit_source(): void {
		$this->assertTrue( ActivityModel::is_manual_email_log( array( 'source' => 'manual' ) ) );
		$this->assertFalse( ActivityModel::is_manual_email_log( array( 'source' => 'sent' ) ) );
	}

	public function test_is_manual_email_log_legacy_heuristic(): void {
		$this->assertTrue(
			ActivityModel::is_manual_email_log(
				array(
					'sent_at' => '2026-01-01 12:00:00',
					'subject' => 'Hello',
				)
			)
		);

		$this->assertFalse(
			ActivityModel::is_manual_email_log(
				array(
					'sent_at'    => '2026-01-01 12:00:00',
					'message_id' => '<abc@example.com>',
				)
			)
		);

		$this->assertFalse(
			ActivityModel::is_manual_email_log(
				array(
					'subject'    => 'Hello',
					'from_email' => 'sender@example.com',
				)
			)
		);
	}
}
