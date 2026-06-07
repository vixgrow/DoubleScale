<?php
/**
 * Contract for {@see ReplyAddressing} — the thread-stable markers shared by the
 * Free outbound stamp (EmailNotifications) and the Pro inbound parser
 * (InboundTicketFactory). If this round-trip drifts, customer email replies stop
 * threading onto their ticket, so the format is pinned here.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Support;

use DoubleScale\Modules\Support\Services\ReplyAddressing;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class ReplyAddressingTest extends TestCase {

	private const HASH = '8006c5b132b43eb76a4e24bdf805b3da';

	public function test_build_reply_to_plus_addresses_the_local_part(): void {
		$reply_to = ReplyAddressing::build_reply_to( 'support@acme.com', 26, self::HASH );

		$this->assertSame( 'support+ticket-26-8006c5b132@acme.com', $reply_to );
	}

	public function test_build_reply_to_leaves_address_unchanged_when_not_taggable(): void {
		// No `@` — not an address we can tag.
		$this->assertSame( 'not-an-email', ReplyAddressing::build_reply_to( 'not-an-email', 26, self::HASH ) );

		// Already carries a sub-address — never stack a second tag.
		$this->assertSame(
			'support+vip@acme.com',
			ReplyAddressing::build_reply_to( 'support+vip@acme.com', 26, self::HASH )
		);

		// No usable ticket id.
		$this->assertSame( 'support@acme.com', ReplyAddressing::build_reply_to( 'support@acme.com', 0, self::HASH ) );

		// No usable hash → no token → fall back to the bare address.
		$this->assertSame( 'support@acme.com', ReplyAddressing::build_reply_to( 'support@acme.com', 26, '' ) );
	}

	public function test_token_is_leading_hex_lowercased(): void {
		$this->assertSame( '8006c5b132', ReplyAddressing::token( self::HASH ) );
		// Upper-case hex is normalised; non-hex characters are stripped first.
		$this->assertSame( 'abcdef0123', ReplyAddressing::token( 'ABCDEF0123456789' ) );
		$this->assertSame( '', ReplyAddressing::token( 'zzzz' ) );
	}

	public function test_parse_recipient_extracts_id_and_token(): void {
		$parsed = ReplyAddressing::parse_recipient( 'support+ticket-26-8006c5b132@acme.com' );

		$this->assertIsArray( $parsed );
		$this->assertSame( 26, $parsed['ticket_id'] );
		$this->assertSame( '8006c5b132', $parsed['token'] );
	}

	public function test_parse_recipient_returns_null_for_non_ticket_addresses(): void {
		$this->assertNull( ReplyAddressing::parse_recipient( 'support@acme.com' ) );
		$this->assertNull( ReplyAddressing::parse_recipient( 'support+vip@acme.com' ) );
		$this->assertNull( ReplyAddressing::parse_recipient( '' ) );
	}

	public function test_token_matches_is_constant_compare_against_hash(): void {
		$this->assertTrue( ReplyAddressing::token_matches( self::HASH, '8006c5b132' ) );
		$this->assertTrue( ReplyAddressing::token_matches( self::HASH, '8006C5B132' ) );
		$this->assertFalse( ReplyAddressing::token_matches( self::HASH, 'deadbeef00' ) );
		$this->assertFalse( ReplyAddressing::token_matches( self::HASH, '' ) );
		$this->assertFalse( ReplyAddressing::token_matches( '', '8006c5b132' ) );
	}

	/**
	 * The end-to-end guarantee the two plugins rely on: an address built on the
	 * Free side parses back to the same ticket on the Pro side, and the token
	 * verifies against the ticket hash.
	 */
	public function test_build_then_parse_round_trips(): void {
		$reply_to = ReplyAddressing::build_reply_to( 'flavourhouse.sheets@gmail.com', 42, self::HASH );
		$parsed   = ReplyAddressing::parse_recipient( $reply_to );

		$this->assertIsArray( $parsed );
		$this->assertSame( 42, $parsed['ticket_id'] );
		$this->assertTrue( ReplyAddressing::token_matches( self::HASH, $parsed['token'] ) );
	}

	public function test_build_message_id_is_structured_and_matches_inbound_pattern(): void {
		$message_id = ReplyAddressing::build_message_id( 26, 'acme.com' );

		$this->assertStringStartsWith( '<doublescale-support-26-', $message_id );
		$this->assertStringEndsWith( '@acme.com>', $message_id );

		// The exact pattern the Pro inbound factory greps out of In-Reply-To.
		$this->assertSame( 1, preg_match( '/doublescale-support-(\d+)-/', $message_id, $m ) );
		$this->assertSame( '26', $m[1] );
	}

	public function test_build_message_id_falls_back_to_localhost_for_empty_host(): void {
		$this->assertStringEndsWith( '@localhost>', ReplyAddressing::build_message_id( 7, '' ) );
	}
}
