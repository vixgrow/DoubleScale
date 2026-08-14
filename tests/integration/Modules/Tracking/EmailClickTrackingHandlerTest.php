<?php
/**
 * Integration coverage for the public email click-tracking endpoint.
 *
 * The unit suite (phpunit/tests/Modules/Emails/EmailClickTrackingTest.php) covers
 * how links are REWRITTEN. This file covers the other half of the round trip: what
 * happens when a recipient actually clicks one, against a real database.
 *
 * Email::email_clicked_tracking() ends in doublescale_safe_redirect(), which calls
 * exit unconditionally. Returning false from the `wp_redirect` filter suppresses the
 * header but NOT the exit, so each redirecting test would otherwise kill the whole
 * PHPUnit process. We therefore capture the target on the filter and throw, which
 * unwinds before exit is reached; assert_redirect() catches that marker.
 *
 * @package DoubleScale\Tests\Integration\Modules\Tracking
 */

namespace DoubleScale\Tests\Integration\Modules\Tracking;

use DoubleScale\Core\Constants\MessageDirection;
use DoubleScale\Core\Constants\MessageSourceTypes;
use DoubleScale\Core\Constants\TrackingStatus;
use DoubleScale\Modules\Tracking\Email;
use DoubleScale\Modules\Tracking\Models\CommunicationTrackingModel;
use DoubleScale\Tests\Integration\Factories\ContactFactory;
use DoubleScale\Tests\Integration\IntegrationTestCase;

/**
 * Marker thrown from the `wp_redirect` filter to unwind before exit.
 */
final class RedirectedException extends \RuntimeException {}

/**
 * @group tracking
 * @group click-tracking
 */
final class EmailClickTrackingHandlerTest extends IntegrationTestCase {

	/** @var string[] Redirect targets captured during the current test. */
	private array $redirects = array();

	/** @var int */
	private int $contact_id;

	public function setUp(): void {
		parent::setUp();

		$this->redirects = array();
		add_filter( 'wp_redirect', array( $this, 'capture_redirect' ), 10, 1 );

		$this->contact_id = ContactFactory::create();
	}

	public function tearDown(): void {
		remove_filter( 'wp_redirect', array( $this, 'capture_redirect' ), 10 );
		unset( $_GET['doublescale'], $_GET['hash_key'], $_GET['original'] );

		parent::tearDown();
	}

	/**
	 * Record the redirect target and abort before doublescale_safe_redirect()'s exit.
	 *
	 * @param string $location
	 * @throws RedirectedException Always, to unwind past the exit.
	 */
	public function capture_redirect( $location ) {
		$this->redirects[] = (string) $location;

		throw new RedirectedException( (string) $location );
	}

	/**
	 * Run the click handler, absorbing the redirect unwind.
	 */
	private function run_handler(): void {
		try {
			( new Email() )->email_clicked_tracking();
		} catch ( RedirectedException $e ) {
			// Expected: the handler redirected instead of returning.
			unset( $e );
		}
	}

	/**
	 * @param array<string, mixed> $overrides
	 */
	private function make_tracking( array $overrides = array() ): CommunicationTrackingModel {
		$defaults = array(
			'contact_id'  => $this->contact_id,
			'hash_key'    => 'hash_' . wp_generate_password( 16, false, false ),
			'mode'        => CommunicationTrackingModel::MODE_EMAIL,
			'direction'   => MessageDirection::OUTBOUND,
			'source_type' => MessageSourceTypes::CAMPAIGN,
			'source_id'   => 1,
			'recipient'   => 'lead@example.test',
			'status'      => TrackingStatus::SENT,
			'opened'      => 0,
			'clicked'     => 0,
			'created_at'  => current_time( 'mysql', true ),
			'updated_at'  => current_time( 'mysql', true ),
		);

		return CommunicationTrackingModel::create( array_merge( $defaults, $overrides ) );
	}

	/**
	 * Simulate a recipient clicking a tracked link.
	 *
	 * Mirrors what add_click_tracking() puts on the wire: `original` is
	 * double-encoded, and PHP itself decodes $_GET once before the handler runs.
	 */
	private function click( string $hash_key, string $destination ): void {
		$_GET['doublescale'] = 'email_click';
		$_GET['hash_key']    = $hash_key;
		$_GET['original']    = urldecode( urlencode( urlencode( $destination ) ) );

		$this->run_handler();
	}

	private function last_redirect(): string {
		$this->assertNotEmpty( $this->redirects, 'Handler did not redirect.' );

		return (string) end( $this->redirects );
	}

	/* ----------------------------------------------------------------- */

	public function test_click_marks_tracking_row_as_clicked(): void {
		$tracking = $this->make_tracking();

		$this->click( $tracking->hash_key, 'https://example.com/offer' );

		$fresh = CommunicationTrackingModel::find( $tracking->id );

		$this->assertEquals( 1, $fresh->clicked );
		$this->assertNotEmpty( $fresh->clicked_at );
	}

	public function test_click_redirects_to_the_original_destination(): void {
		$tracking = $this->make_tracking();

		$this->click( $tracking->hash_key, 'https://example.com/sale?ref=abc' );

		$this->assertSame( 'https://example.com/sale?ref=abc', $this->last_redirect() );
	}

	/**
	 * Destinations carrying literal percent-escapes / "+" only survive because the
	 * link builder double-encodes. This is the end-to-end guard for that.
	 *
	 * @dataProvider tricky_destination_provider
	 */
	public function test_click_redirect_preserves_tricky_destinations( string $destination ): void {
		$tracking = $this->make_tracking();

		$this->click( $tracking->hash_key, $destination );

		$this->assertSame( $destination, $this->last_redirect() );
	}

	/**
	 * @return array<string, array{0: string}>
	 */
	public function tricky_destination_provider(): array {
		return array(
			'query string'     => array( 'https://example.com/p?a=1&b=2' ),
			'encoded space'    => array( 'https://example.com/a%20b' ),
			'plus and percent' => array( 'https://example.com/p?q=a+b&r=100%25' ),
			'utm tagged'       => array( 'https://example.com/p?utm_source=news&utm_medium=email' ),
		);
	}

	public function test_click_also_marks_email_as_opened(): void {
		// Image-blocking clients never load the pixel, so a click is the only
		// evidence the message was seen.
		$tracking = $this->make_tracking( array( 'opened' => 0 ) );

		$this->click( $tracking->hash_key, 'https://example.com/offer' );

		$fresh = CommunicationTrackingModel::find( $tracking->id );

		$this->assertEquals( 1, $fresh->opened );
		$this->assertNotEmpty( $fresh->opened_at );
	}

	public function test_first_click_fires_the_click_action_once(): void {
		$tracking = $this->make_tracking();
		$calls    = 0;

		add_action(
			'doublescale_mail_click',
			static function () use ( &$calls ) {
				++$calls;
			}
		);

		$this->click( $tracking->hash_key, 'https://example.com/offer' );
		$this->click( $tracking->hash_key, 'https://example.com/offer' );

		// Lead scoring / notifications must not compound on repeat clicks.
		$this->assertSame( 1, $calls );
	}

	public function test_repeat_click_keeps_the_original_clicked_at(): void {
		$tracking = $this->make_tracking(
			array(
				'clicked'    => 1,
				'clicked_at' => '2020-01-01 00:00:00',
			)
		);

		$this->click( $tracking->hash_key, 'https://example.com/offer' );

		$fresh = CommunicationTrackingModel::find( $tracking->id );

		$this->assertSame( '2020-01-01 00:00:00', $fresh->clicked_at );
		// Still redirects — the recipient must reach the page either way.
		$this->assertSame( 'https://example.com/offer', $this->last_redirect() );
	}

	public function test_click_on_automation_message_is_tracked(): void {
		// Automations write source_type=AUTOMATION; the handler keys off hash_key
		// only, so both sources must behave identically.
		$tracking = $this->make_tracking(
			array(
				'source_type' => MessageSourceTypes::AUTOMATION,
				'source_id'   => 77,
				'step_id'     => 5,
			)
		);

		$this->click( $tracking->hash_key, 'https://example.com/offer' );

		$fresh = CommunicationTrackingModel::find( $tracking->id );

		$this->assertEquals( 1, $fresh->clicked );
		$this->assertEquals( MessageSourceTypes::AUTOMATION, $fresh->source_type );
	}

	public function test_unknown_hash_key_does_not_redirect(): void {
		$this->click( 'hash_that_does_not_exist', 'https://example.com/offer' );

		$this->assertSame( array(), $this->redirects );
	}

	public function test_failed_outbound_message_redirects_without_marking_clicked(): void {
		$tracking = $this->make_tracking(
			array(
				'status'    => TrackingStatus::FAILED,
				'direction' => MessageDirection::OUTBOUND,
			)
		);

		$this->click( $tracking->hash_key, 'https://example.com/offer' );

		$fresh = CommunicationTrackingModel::find( $tracking->id );

		$this->assertEquals( 0, $fresh->clicked, 'Failed sends must not count as clicks.' );
		$this->assertSame( 'https://example.com/offer', $this->last_redirect() );
	}

	public function test_non_http_destination_falls_back_to_home(): void {
		// Open-redirect guard: javascript:/data: URLs must never be honoured.
		$tracking = $this->make_tracking();

		$this->click( $tracking->hash_key, 'javascript:alert(1)' );

		$this->assertSame( home_url(), $this->last_redirect() );
	}

	public function test_broken_unsubscribe_merge_tag_redirects_to_unsubscribe(): void {
		// Guards the compensating path for hrefs left as "unsubscribe_link}}".
		$tracking = $this->make_tracking();

		$this->click( $tracking->hash_key, 'https://example.com/unsubscribe_link}}' );

		$this->assertStringContainsString( 'doublescale-unsubscribe=1', $this->last_redirect() );
	}

	public function test_link_trigger_destination_carries_track_id_through(): void {
		$tracking = $this->make_tracking();

		$this->click(
			$tracking->hash_key,
			home_url( '/?doublescale-link-trigger=trg123' )
		);

		$redirect = $this->last_redirect();

		$this->assertStringContainsString( 'doublescale-link-trigger=trg123', $redirect );
		$this->assertStringContainsString( 'track-id=' . $tracking->hash_key, $redirect );
	}

	public function test_missing_original_param_is_ignored(): void {
		$tracking = $this->make_tracking();

		$_GET['doublescale'] = 'email_click';
		$_GET['hash_key']    = $tracking->hash_key;
		unset( $_GET['original'] );

		$this->run_handler();

		$fresh = CommunicationTrackingModel::find( $tracking->id );

		$this->assertEquals( 0, $fresh->clicked );
		$this->assertSame( array(), $this->redirects );
	}

	public function test_sms_row_is_not_matched_by_email_click_handler(): void {
		// The query is scoped to mode=EMAIL; an Sms row sharing a hash must not match.
		$tracking = $this->make_tracking(
			array( 'mode' => CommunicationTrackingModel::MODE_SMS )
		);

		$this->click( $tracking->hash_key, 'https://example.com/offer' );

		$fresh = CommunicationTrackingModel::find( $tracking->id );

		$this->assertEquals( 0, $fresh->clicked );
		$this->assertSame( array(), $this->redirects );
	}
}
