<?php
/**
 * Contract for {@see EmailReplyParser} — strips the quoted history mail clients
 * append below a reply. The Pro inbound factory runs every customer email reply
 * through it, so the per-client cases below pin the behaviour the support thread
 * depends on (show only what the customer typed, never blank out a real reply).
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Support;

use DoubleScale\Modules\Support\Services\EmailReplyParser;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class EmailReplyParserTest extends TestCase {

	public function test_strips_gmail_quote_container(): void {
		$html = '<div dir="ltr">Thanks, I will.</div>'
			. '<div class="gmail_quote">'
			. '<div dir="ltr" class="gmail_attr">On Sun, Jun 7, 2026 at 12:56 PM &lt;a@b.com&gt; wrote:<br></div>'
			. '<blockquote class="gmail_quote" style="border-left:1px solid #ccc">yes try me</blockquote>'
			. '</div>';

		$out = EmailReplyParser::strip_quoted_reply( $html );

		$this->assertStringContainsString( 'Thanks, I will.', $out );
		$this->assertStringNotContainsString( 'yes try me', $out );
		$this->assertStringNotContainsString( 'wrote:', $out );
	}

	public function test_strips_apple_mail_cite_blockquote_and_attribution(): void {
		$html = '<div>Thanks, I will.</div>'
			. '<br>'
			. '<div>On Jun 7, 2026, at 12:56, John &lt;a@b.com&gt; wrote:</div>'
			. '<blockquote type="cite">yes try me</blockquote>';

		$out = EmailReplyParser::strip_quoted_reply( $html );

		$this->assertStringContainsString( 'Thanks, I will.', $out );
		$this->assertStringNotContainsString( 'yes try me', $out );
		$this->assertStringNotContainsString( 'wrote:', $out );
	}

	public function test_strips_outlook_appendonsend_boundary(): void {
		$html = '<div>Thanks, I will.</div>'
			. '<div id="appendonsend"></div>'
			. '<hr>'
			. '<div>From: John<br>Sent: Sunday<br>To: Support<br>Subject: Re: Hi</div>'
			. '<div>yes try me</div>';

		$out = EmailReplyParser::strip_quoted_reply( $html );

		$this->assertStringContainsString( 'Thanks, I will.', $out );
		$this->assertStringNotContainsString( 'yes try me', $out );
		$this->assertStringNotContainsString( 'Subject: Re: Hi', $out );
	}

	public function test_strips_yahoo_quoted_container(): void {
		$html = '<div>Thanks, I will.</div>'
			. '<div class="yahoo_quoted">On Sunday, John wrote: yes try me</div>';

		$out = EmailReplyParser::strip_quoted_reply( $html );

		$this->assertStringContainsString( 'Thanks, I will.', $out );
		$this->assertStringNotContainsString( 'yes try me', $out );
	}

	public function test_cuts_plain_text_on_wrote_delimiter(): void {
		$body = "Thanks, I will.\n\nOn Sun, Jun 7, 2026 at 12:56 PM John wrote:\n> yes try me";

		$out = EmailReplyParser::strip_quoted_reply( $body );

		$this->assertStringContainsString( 'Thanks, I will.', $out );
		$this->assertStringNotContainsString( 'yes try me', $out );
	}

	public function test_cuts_plain_text_original_message_delimiter(): void {
		$body = "Sounds good.\n\n-----Original Message-----\nFrom: Support\nyes try me";

		$out = EmailReplyParser::strip_quoted_reply( $body );

		$this->assertStringContainsString( 'Sounds good.', $out );
		$this->assertStringNotContainsString( 'yes try me', $out );
		$this->assertStringNotContainsString( 'Original Message', $out );
	}

	public function test_returns_original_when_no_quote_markers(): void {
		$html = '<p>Just a normal reply with no quoted history at all.</p>';

		$this->assertSame( $html, EmailReplyParser::strip_quoted_reply( $html ) );
	}

	public function test_does_not_truncate_legitimate_from_line(): void {
		// A bare "From:" must NOT be treated as a quote delimiter.
		$body = "Hi team,\n\nFrom: my point of view this is working great now.";

		$out = EmailReplyParser::strip_quoted_reply( $body );

		$this->assertStringContainsString( 'my point of view', $out );
	}

	public function test_returns_original_when_stripping_would_empty_body(): void {
		// Entire body is the quote (no reply text above it) → keep the original
		// rather than store a blank reply.
		$html = '<div class="gmail_quote"><blockquote class="gmail_quote">only quoted text</blockquote></div>';

		$this->assertSame( $html, EmailReplyParser::strip_quoted_reply( $html ) );
	}

	public function test_empty_input_is_returned_unchanged(): void {
		$this->assertSame( '', EmailReplyParser::strip_quoted_reply( '' ) );
		$this->assertSame( '   ', EmailReplyParser::strip_quoted_reply( '   ' ) );
	}
}
