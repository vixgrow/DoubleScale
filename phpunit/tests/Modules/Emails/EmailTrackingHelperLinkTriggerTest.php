<?php
/**
 * Link-trigger track-id injection for bulk / curl-multi email bodies.
 *
 * @package DoubleScale\Tests\Modules\Emails
 */

namespace DoubleScale\Tests\Modules\Emails;

use DoubleScale\Modules\Emails\EmailTrackingHelper;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group emails
 * @group link-triggers
 */
final class EmailTrackingHelperLinkTriggerTest extends TestCase {

	public function test_inject_appends_track_id_placeholder(): void {
		$html = '<p><a href="https://example.com/?doublescale-link-trigger=abc123">Go</a></p>';

		$result = EmailTrackingHelper::inject_link_trigger_track_id_placeholder( $html );

		$this->assertStringContainsString(
			'doublescale-link-trigger=abc123&track-id={{tracking:hash_key}}',
			$result
		);
	}

	public function test_inject_skips_urls_that_already_have_track_id(): void {
		$html = '<a href="https://example.com/?doublescale-link-trigger=abc123&track-id=existing">Go</a>';

		$result = EmailTrackingHelper::inject_link_trigger_track_id_placeholder( $html );

		$this->assertSame( $html, $result );
		$this->assertSame( 1, substr_count( $result, 'track-id=' ) );
	}

	public function test_inject_leaves_unrelated_links_alone(): void {
		$html = '<a href="https://example.com/pricing">Pricing</a>';

		$this->assertSame(
			$html,
			EmailTrackingHelper::inject_link_trigger_track_id_placeholder( $html )
		);
	}

	public function test_inject_handles_html_entity_ampersands_in_href(): void {
		$html = '<a href="https://example.com/?doublescale-link-trigger=abc123&amp;utm=1">Go</a>';

		$result = EmailTrackingHelper::inject_link_trigger_track_id_placeholder( $html );

		$this->assertStringContainsString( 'track-id={{tracking:hash_key}}', $result );
	}
}
