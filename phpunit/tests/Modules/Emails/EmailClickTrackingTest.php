<?php
/**
 * Deep coverage for email click tracking across campaign / automation / individual paths.
 *
 * Scope of this file:
 *  - EmailTrackingHelper::add_click_tracking() link rewriting rules (the "good" path).
 *  - AbstractTracking::add_click_tracking() raw-URL rewriting (the legacy 2-arg path).
 *  - Divergence between the two, which is what makes campaign bulk sends lose clicks.
 *
 * Several tests below are CHARACTERIZATION tests: they lock in behaviour that is
 * currently WRONG so the bug is visible and a fix flips a documented assertion
 * instead of silently changing meaning. Each is marked with `BUG:` and names the
 * production call site it protects.
 *
 * @package DoubleScale\Tests\Modules\Emails
 */

namespace DoubleScale\Tests\Modules\Emails;

use DoubleScale\Modules\Campaigns\Models\TemplateModel;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Emails\EmailTrackingHelper;
use DoubleScale\Modules\Tracking\Email;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group emails
 * @group tracking
 * @group click-tracking
 */
final class EmailClickTrackingTest extends TestCase {

	private const HASH = 'hash_abc123';

	/**
	 * Contact stub — add_click_tracking() only reads ->email (for link triggers).
	 */
	private function contact( string $email = 'lead@example.com' ): ContactModel {
		$contact        = new ContactModel();
		$contact->id    = 42;
		$contact->email = $email;

		return $contact;
	}

	/**
	 * Extract the `original` query arg from the first tracking URL in $html.
	 *
	 * The value is double-encoded on the way out: add_click_tracking() urlencode()s
	 * the destination, then add_query_arg()/http_build_query() encodes it again. So
	 * recovering the destination needs two urldecode() passes — which is exactly what
	 * Email::email_clicked_tracking() does at read time (PHP decodes $_GET once,
	 * the handler calls urldecode() once more).
	 */
	private function first_original_url( string $html ): ?string {
		if ( ! preg_match( '/original=([^"&\']+)/', $html, $m ) ) {
			return null;
		}

		return urldecode( urldecode( $m[1] ) );
	}

	/**
	 * Real TemplateModel — add_utm_parameters() has a strict TemplateModel typehint,
	 * so an anonymous stub cannot be substituted. get_setting() just reads the
	 * `settings` attribute, so no DB is required.
	 *
	 * @param array<string, mixed> $settings
	 */
	private function template( array $settings ): TemplateModel {
		$template           = new TemplateModel();
		$template->settings = $settings;

		return $template;
	}

	/* -----------------------------------------------------------------
	 * 1. Core rewriting — the individual / non-bulk campaign path.
	 * ----------------------------------------------------------------- */

	public function test_plain_link_is_wrapped_in_click_tracker(): void {
		$html = '<a href="https://example.com/pricing">Pricing</a>';

		$out = EmailTrackingHelper::add_click_tracking( $html, self::HASH, $this->contact() );

		$this->assertStringContainsString( 'doublescale=email_click', $out );
		$this->assertStringContainsString( 'hash_key=' . self::HASH, $out );
		$this->assertSame( 'https://example.com/pricing', $this->first_original_url( $out ) );
	}

	public function test_anchor_text_and_other_attributes_are_preserved(): void {
		$html = '<a class="btn" href="https://example.com/x" target="_blank">Click me</a>';

		$out = EmailTrackingHelper::add_click_tracking( $html, self::HASH, $this->contact() );

		$this->assertStringContainsString( 'class="btn"', $out );
		$this->assertStringContainsString( 'target="_blank"', $out );
		$this->assertStringContainsString( '>Click me</a>', $out );
	}

	public function test_multiple_distinct_links_are_each_wrapped(): void {
		$html = '<a href="https://a.example/one">A</a><a href="https://b.example/two">B</a>';

		$out = EmailTrackingHelper::add_click_tracking( $html, self::HASH, $this->contact() );

		$this->assertSame( 2, substr_count( $out, 'doublescale=email_click' ) );
		// Destinations are double-encoded in the emitted href (see first_original_url).
		$this->assertStringContainsString( urlencode( urlencode( 'https://a.example/one' ) ), $out );
		$this->assertStringContainsString( urlencode( urlencode( 'https://b.example/two' ) ), $out );
	}

	public function test_single_quoted_href_is_supported(): void {
		$html = "<a href='https://example.com/single'>S</a>";

		$out = EmailTrackingHelper::add_click_tracking( $html, self::HASH, $this->contact() );

		$this->assertStringContainsString( 'doublescale=email_click', $out );
		$this->assertSame( 'https://example.com/single', $this->first_original_url( $out ) );
	}

	public function test_url_is_encoded_so_its_own_query_string_survives(): void {
		$html = '<a href="https://example.com/p?a=1&b=2">Q</a>';

		$out      = EmailTrackingHelper::add_click_tracking( $html, self::HASH, $this->contact() );
		$original = $this->first_original_url( $out );

		// The nested query must round-trip intact, not leak into the tracker's own args.
		$this->assertSame( 'https://example.com/p?a=1&b=2', $original );
	}

	/* -----------------------------------------------------------------
	 * 2. Skip rules — things that must NOT be rewritten.
	 * ----------------------------------------------------------------- */

	public function test_already_tracked_url_is_not_double_wrapped(): void {
		$tracked = 'http://example.test/?doublescale=email_click&hash_key=' . self::HASH
			. '&original=' . urlencode( 'https://example.com/x' );
		$html    = '<a href="' . $tracked . '">X</a>';

		$out = EmailTrackingHelper::add_click_tracking( $html, self::HASH, $this->contact() );

		$this->assertSame( 1, substr_count( $out, 'doublescale=email_click' ) );
	}

	public function test_open_tracking_pixel_url_is_not_rewritten(): void {
		$html = '<a href="http://example.test/?doublescale=email_open&hash_key=x">O</a>';

		$out = EmailTrackingHelper::add_click_tracking( $html, self::HASH, $this->contact() );

		$this->assertStringNotContainsString( 'email_click', $out );
	}

	public function test_processed_unsubscribe_link_is_not_rewritten(): void {
		$html = '<a href="http://example.test/?doublescale-unsubscribe=1&id=abc">Unsubscribe</a>';

		$out = EmailTrackingHelper::add_click_tracking( $html, self::HASH, $this->contact() );

		$this->assertSame( $html, $out );
	}

	public function test_unprocessed_unsubscribe_merge_tag_is_not_rewritten(): void {
		// Guards the footer case where merge tags have not been expanded yet.
		$html = '<a href="{{contact:unsubscribe_link}}">Unsubscribe</a>';

		$out = EmailTrackingHelper::add_click_tracking( $html, self::HASH, $this->contact() );

		$this->assertSame( $html, $out );
	}

	public function test_bare_url_in_text_is_not_rewritten(): void {
		// Only <a href> is rewritten by this helper — plain text URLs stay put.
		$html = '<p>Visit https://example.com/plain for details</p>';

		$out = EmailTrackingHelper::add_click_tracking( $html, self::HASH, $this->contact() );

		$this->assertSame( $html, $out );
	}

	public function test_image_src_is_not_rewritten(): void {
		$html = '<img src="https://cdn.example.com/logo.png" alt="" />';

		$out = EmailTrackingHelper::add_click_tracking( $html, self::HASH, $this->contact() );

		$this->assertSame( $html, $out );
	}

	public function test_message_without_links_is_returned_unchanged(): void {
		$html = '<p>No links here at all.</p>';

		$this->assertSame(
			$html,
			EmailTrackingHelper::add_click_tracking( $html, self::HASH, $this->contact() )
		);
	}

	public function test_empty_message_is_safe(): void {
		$this->assertSame(
			'',
			EmailTrackingHelper::add_click_tracking( '', self::HASH, $this->contact() )
		);
	}

	/* -----------------------------------------------------------------
	 * 3. UTM parameters — only applied when the template enables them.
	 * ----------------------------------------------------------------- */

	public function test_utm_params_are_added_to_original_url_when_enabled(): void {
		$template = $this->template(
			array(
				'enable_utm'   => true,
				'utm_source'   => 'newsletter',
				'utm_medium'   => 'email',
				'utm_campaign' => 'spring',
			)
		);

		$out      = EmailTrackingHelper::add_click_tracking(
			'<a href="https://example.com/p">P</a>',
			self::HASH,
			$this->contact(),
			$template
		);
		$original = $this->first_original_url( $out );

		// UTMs must live on the *destination*, so they survive the redirect.
		$this->assertStringContainsString( 'utm_source=newsletter', (string) $original );
		$this->assertStringContainsString( 'utm_medium=email', (string) $original );
		$this->assertStringContainsString( 'utm_campaign=spring', (string) $original );
	}

	public function test_utm_params_are_skipped_when_flag_disabled(): void {
		$template = $this->template(
			array(
				'enable_utm' => false,
				'utm_source' => 'newsletter',
			)
		);

		$out = EmailTrackingHelper::add_click_tracking(
			'<a href="https://example.com/p">P</a>',
			self::HASH,
			$this->contact(),
			$template
		);

		$this->assertStringNotContainsString( 'utm_source', (string) $this->first_original_url( $out ) );
	}

	public function test_utm_enabled_but_no_values_leaves_url_untouched(): void {
		$template = $this->template( array( 'enable_utm' => true ) );

		$out = EmailTrackingHelper::add_click_tracking(
			'<a href="https://example.com/p">P</a>',
			self::HASH,
			$this->contact(),
			$template
		);

		$this->assertSame( 'https://example.com/p', $this->first_original_url( $out ) );
	}

	public function test_no_template_means_no_utm(): void {
		$out = EmailTrackingHelper::add_click_tracking(
			'<a href="https://example.com/p">P</a>',
			self::HASH,
			$this->contact(),
			null
		);

		$this->assertSame( 'https://example.com/p', $this->first_original_url( $out ) );
	}

	/* -----------------------------------------------------------------
	 * 4. Link triggers (Pro). Free-only runtime must degrade, not crash.
	 * ----------------------------------------------------------------- */

	public function test_link_trigger_href_is_left_alone_when_pro_is_absent(): void {
		if ( class_exists( '\DoubleScale\Pro\Modules\LinkTriggers\Models\LinkTriggerModel' ) ) {
			$this->markTestSkipped( 'Pro link triggers are loaded; free-only degradation not observable.' );
		}

		$html = '<a href="http://example.test/?doublescale-link-trigger=trg1">Trigger</a>';

		$out = EmailTrackingHelper::add_click_tracking( $html, self::HASH, $this->contact() );

		// `continue` on missing trigger => untouched, and crucially not crashed.
		$this->assertSame( $html, $out );
		$this->assertStringNotContainsString( 'email_click', $out );
	}

	/* -----------------------------------------------------------------
	 * 5. Bulk / curl-multi placeholder injection (shared body, N recipients).
	 * ----------------------------------------------------------------- */

	public function test_bulk_recipient_variables_expose_hash_key_and_pixel(): void {
		$tracking           = new \DoubleScale\Modules\Tracking\Models\CommunicationTrackingModel();
		$tracking->hash_key = self::HASH;

		$vars = EmailTrackingHelper::bulk_tracking_recipient_variables( $tracking );

		$this->assertSame( self::HASH, $vars['hash_key'] );
		$this->assertStringContainsString( 'doublescale=email_open', $vars['tracking_pixel'] );
		$this->assertStringContainsString( self::HASH, $vars['tracking_pixel'] );
		$this->assertStringContainsString( 'doublescale=email_unsubscribe', $vars['unsubscribe_url'] );
	}

	/**
	 * The link-trigger injector is deliberately narrow: it touches only
	 * link-trigger hrefs. Ordinary links are the job of inject_bulk_click_tracking().
	 */
	public function test_link_trigger_injector_ignores_ordinary_links(): void {
		$html = '<a href="https://example.com/offer">Offer</a>';

		$out = EmailTrackingHelper::inject_link_trigger_track_id_placeholder( $html );

		$this->assertSame( $html, $out );
	}

	public function test_bulk_injection_handles_multiple_trigger_links(): void {
		$html = '<a href="http://example.test/?doublescale-link-trigger=a">A</a>'
			. '<a href="http://example.test/?doublescale-link-trigger=b">B</a>';

		$out = EmailTrackingHelper::inject_link_trigger_track_id_placeholder( $html );

		$this->assertSame( 2, substr_count( $out, 'track-id={{tracking:hash_key}}' ) );
	}

	public function test_bulk_injection_placeholder_braces_are_not_encoded(): void {
		// add_query_arg would percent-encode the braces and break substitution.
		$html = '<a href="http://example.test/?doublescale-link-trigger=a">A</a>';

		$out = EmailTrackingHelper::inject_link_trigger_track_id_placeholder( $html );

		$this->assertStringContainsString( '{{tracking:hash_key}}', $out );
		$this->assertStringNotContainsString( '%7B%7B', $out );
	}

	public function test_bulk_injection_is_idempotent(): void {
		$html = '<a href="http://example.test/?doublescale-link-trigger=a">A</a>';

		$once  = EmailTrackingHelper::inject_link_trigger_track_id_placeholder( $html );
		$twice = EmailTrackingHelper::inject_link_trigger_track_id_placeholder( $once );

		$this->assertSame( $once, $twice );
		$this->assertSame( 1, substr_count( $twice, 'track-id=' ) );
	}

	public function test_bulk_injection_short_circuits_on_non_string_and_empty(): void {
		$this->assertSame( '', EmailTrackingHelper::inject_link_trigger_track_id_placeholder( '' ) );
		$this->assertSame( '<p>x</p>', EmailTrackingHelper::inject_link_trigger_track_id_placeholder( '<p>x</p>' ) );
	}

	/* -----------------------------------------------------------------
	 * 5b. Bulk CLICK tracking — the fix for the lost-clicks bug.
	 *
	 *     One shared body, N recipients => hash_key must stay a placeholder
	 *     that each mailer rewrites from recipient_variables.
	 * ----------------------------------------------------------------- */

	public function test_bulk_click_tracking_wraps_ordinary_links(): void {
		$html = '<a href="https://example.com/offer">Offer</a>';

		$out = EmailTrackingHelper::inject_bulk_click_tracking( $html );

		$this->assertStringContainsString( 'doublescale=email_click', $out );
		$this->assertStringContainsString(
			'original=' . urlencode( urlencode( 'https://example.com/offer' ) ),
			$out
		);
	}

	/**
	 * The whole point of the bulk variant: hash_key stays a merge tag, because the
	 * body is shared. A literal hash here would attribute every recipient's click
	 * to one contact.
	 */
	public function test_bulk_click_tracking_leaves_hash_key_as_placeholder(): void {
		$out = EmailTrackingHelper::inject_bulk_click_tracking(
			'<a href="https://example.com/offer">Offer</a>'
		);

		$this->assertStringContainsString( 'hash_key={{tracking:hash_key}}', $out );
	}

	/**
	 * Regression guard for the encoding trap: add_query_arg()/http_build_query()
	 * percent-encode `{{` to `%7B%7B`, after which no mailer's merge-tag regex
	 * matches and every recipient would get an unsubstituted placeholder.
	 */
	public function test_bulk_click_tracking_does_not_encode_placeholder_braces(): void {
		$out = EmailTrackingHelper::inject_bulk_click_tracking(
			'<a href="https://example.com/offer">Offer</a>'
		);

		$this->assertStringNotContainsString( '%7B%7B', $out );
		$this->assertStringNotContainsString( '%3Ahash_key', $out );
	}

	/**
	 * End-to-end contract with the mailer layer: whatever we emit must survive each
	 * provider's convert_merge_tags() into that provider's own variable syntax.
	 *
	 * @dataProvider mailer_conversion_provider
	 */
	public function test_bulk_placeholder_converts_for_each_mailer( string $mailer_class, string $expected ): void {
		if ( ! class_exists( $mailer_class ) ) {
			$this->markTestSkipped( $mailer_class . ' not available.' );
		}

		$html = EmailTrackingHelper::inject_bulk_click_tracking(
			'<a href="https://example.com/offer">Offer</a>'
		);

		$converted = ( new $mailer_class() )->convert_merge_tags( $html );

		$this->assertStringContainsString( 'hash_key=' . $expected, $converted );
		$this->assertStringNotContainsString( '{{tracking:', $converted );
	}

	/**
	 * @return array<string, array{0: string, 1: string}>
	 */
	public function mailer_conversion_provider(): array {
		$ns = '\DoubleScale\Modules\Emails\Bulkmailers\\';

		return array(
			'mailgun'     => array( $ns . 'MailgunBulkMailer', '%recipient.hash_key%' ),
			'sendgrid'    => array( $ns . 'SendgridBulkMailer', '{{hash_key}}' ),
			'postmark'    => array( $ns . 'PostmarkBulkMailer', '{{hash_key}}' ),
			'sparkpost'   => array( $ns . 'SparkpostBulkMailer', '{{hash_key}}' ),
			'mailersend'  => array( $ns . 'MailersendBulkMailer', '{{hash_key}}' ),
			'aws'         => array( $ns . 'AwsBulkMailer', '{{hash_key}}' ),
			'elasticmail' => array( $ns . 'ElasticemailBulkMailer', '{hash_key}' ),
			'mailjet'     => array( $ns . 'MailjetBulkMailer', '{{var:hash_key}}' ),
			'sendinblue'  => array( $ns . 'SendinblueBulkMailer', '{{params.hash_key}}' ),
		);
	}

	public function test_bulk_click_tracking_skips_link_trigger_urls(): void {
		// Link triggers are handled by inject_link_trigger_track_id_placeholder();
		// double-wrapping would bury the trigger hash inside `original`.
		$html = '<a href="http://example.test/?doublescale-link-trigger=abc">T</a>';

		$out = EmailTrackingHelper::inject_bulk_click_tracking( $html );

		$this->assertSame( $html, $out );
	}

	public function test_bulk_click_tracking_runs_cleanly_after_link_trigger_injection(): void {
		// Real pipeline order from EmailProcessing: triggers first, then clicks.
		$html = '<a href="http://example.test/?doublescale-link-trigger=abc">T</a>'
			. '<a href="https://example.com/offer">O</a>';

		$out = EmailTrackingHelper::inject_link_trigger_track_id_placeholder( $html );
		$out = EmailTrackingHelper::inject_bulk_click_tracking( $out );

		// Trigger link keeps its track-id and is NOT click-wrapped.
		$this->assertStringContainsString( 'doublescale-link-trigger=abc&track-id={{tracking:hash_key}}', $out );
		// Ordinary link IS click-wrapped, exactly once.
		$this->assertSame( 1, substr_count( $out, 'doublescale=email_click' ) );
	}

	public function test_bulk_click_tracking_skips_unsubscribe_and_pixel(): void {
		$html = '<a href="http://example.test/?doublescale=email_unsubscribe&hash_key=x">U</a>'
			. '<a href="http://example.test/?doublescale-unsubscribe=1&id=y">U2</a>';

		$out = EmailTrackingHelper::inject_bulk_click_tracking( $html );

		$this->assertSame( $html, $out );
	}

	public function test_bulk_click_tracking_skips_unexpanded_merge_tag_hrefs(): void {
		// The bulk footer carries {{contact:unsubscribe_link}} style hrefs.
		$html = '<a href="{{contact:unsubscribe_link}}">Unsubscribe</a>';

		$out = EmailTrackingHelper::inject_bulk_click_tracking( $html );

		$this->assertSame( $html, $out );
	}

	/**
	 * Ordering hazard: get_bulk_footer_content() converts the footer's merge tags to
	 * the provider's own syntax BEFORE inject_bulk_click_tracking() runs, so by then
	 * the unsubscribe href is `%recipient.unsubscribe_url%` / `{{unsubscribe_url}}` /
	 * `{unsubscribe_url}` / `{{var:unsubscribe_url}}` rather than a `{{group:field}}`
	 * tag. Wrapping any of those would break unsubscribe for the whole batch.
	 *
	 * @dataProvider converted_footer_href_provider
	 */
	public function test_bulk_click_tracking_skips_provider_converted_footer_hrefs( string $href ): void {
		$html = '<a href="' . $href . '">Unsubscribe</a>';

		$this->assertSame( $html, EmailTrackingHelper::inject_bulk_click_tracking( $html ) );
	}

	/**
	 * @return array<string, array{0: string}>
	 */
	public function converted_footer_href_provider(): array {
		return array(
			'mailgun'     => array( '%recipient.unsubscribe_url%' ),
			'sendgrid'    => array( '{{unsubscribe_url}}' ),
			'elasticmail' => array( '{unsubscribe_url}' ),
			'mailjet'     => array( '{{var:unsubscribe_url}}' ),
			'sendinblue'  => array( '{{params.unsubscribe_url}}' ),
		);
	}

	public function test_bulk_click_tracking_skips_non_http_schemes(): void {
		$html = '<a href="mailto:hi@example.com">Mail</a>'
			. '<a href="tel:+201234">Call</a>'
			. '<a href="#section">Anchor</a>';

		$out = EmailTrackingHelper::inject_bulk_click_tracking( $html );

		$this->assertSame( $html, $out );
	}

	public function test_bulk_click_tracking_is_idempotent(): void {
		$html = '<a href="https://example.com/offer">Offer</a>';

		$once  = EmailTrackingHelper::inject_bulk_click_tracking( $html );
		$twice = EmailTrackingHelper::inject_bulk_click_tracking( $once );

		$this->assertSame( $once, $twice );
		$this->assertSame( 1, substr_count( $twice, 'doublescale=email_click' ) );
	}

	public function test_bulk_click_tracking_applies_utm_when_enabled(): void {
		$template = $this->template(
			array(
				'enable_utm' => true,
				'utm_source' => 'newsletter',
			)
		);

		$out = EmailTrackingHelper::inject_bulk_click_tracking(
			'<a href="https://example.com/offer">Offer</a>',
			$template
		);

		// UTM must ride on the destination, not on the tracker URL itself.
		$this->assertStringContainsString( 'utm_source=newsletter', (string) $this->first_original_url( $out ) );
		$this->assertStringNotContainsString( '&utm_source', explode( '&original=', $out )[0] );
	}

	public function test_bulk_click_tracking_preserves_anchor_markup(): void {
		$html = '<a class="cta" href="https://example.com/offer" style="color:red">Buy now</a>';

		$out = EmailTrackingHelper::inject_bulk_click_tracking( $html );

		$this->assertStringContainsString( 'class="cta"', $out );
		$this->assertStringContainsString( 'style="color:red"', $out );
		$this->assertStringContainsString( '>Buy now</a>', $out );
	}

	public function test_bulk_click_tracking_handles_multiple_links(): void {
		$html = '<a href="https://a.example/1">A</a><a href="https://b.example/2">B</a>';

		$out = EmailTrackingHelper::inject_bulk_click_tracking( $html );

		$this->assertSame( 2, substr_count( $out, 'doublescale=email_click' ) );
		$this->assertSame( 2, substr_count( $out, '{{tracking:hash_key}}' ) );
	}

	public function test_bulk_click_tracking_does_not_touch_image_src(): void {
		$html = '<img src="https://cdn.example.com/logo.png" alt="" />';

		$this->assertSame( $html, EmailTrackingHelper::inject_bulk_click_tracking( $html ) );
	}

	public function test_bulk_click_tracking_short_circuits_on_empty_and_linkless(): void {
		$this->assertSame( '', EmailTrackingHelper::inject_bulk_click_tracking( '' ) );
		$this->assertSame( '<p>x</p>', EmailTrackingHelper::inject_bulk_click_tracking( '<p>x</p>' ) );
	}

	public function test_bulk_click_tracking_preserves_destination_query_string(): void {
		$html = '<a href="https://example.com/p?a=1&b=2">Q</a>';

		$out = EmailTrackingHelper::inject_bulk_click_tracking( $html );

		$this->assertSame( 'https://example.com/p?a=1&b=2', $this->first_original_url( $out ) );
	}

	/**
	 * The bulk tracker must encode `original` the same way the non-bulk one does
	 * (twice), because Email::email_clicked_tracking() decodes twice: PHP decodes
	 * $_GET once, then the handler calls urldecode() again. Encoding only once here
	 * would silently corrupt destinations containing literal percent-escapes or "+".
	 *
	 * @dataProvider tricky_destination_provider
	 */
	public function test_bulk_click_tracking_destination_survives_handler_decode( string $destination ): void {
		$out = EmailTrackingHelper::inject_bulk_click_tracking(
			'<a href="' . $destination . '">D</a>'
		);

		preg_match( '/original=([^"&\']+)/', $out, $m );

		// Replay exactly what the handler does to $_GET['original'].
		$after_php_get  = urldecode( $m[1] );
		$after_handler  = urldecode( $after_php_get );

		$this->assertSame( $destination, $after_handler );
	}

	/**
	 * @return array<string, array{0: string}>
	 */
	public function tricky_destination_provider(): array {
		return array(
			'plain'                => array( 'https://example.com/sale' ),
			'query string'         => array( 'https://example.com/p?a=1&b=2' ),
			'encoded space'        => array( 'https://example.com/a%20b' ),
			'plus and percent'     => array( 'https://example.com/p?q=a+b&r=100%25' ),
			'utm already present'  => array( 'https://example.com/p?utm_source=x' ),
		);
	}

	/* -----------------------------------------------------------------
	 * 5c. Wiring guard.
	 *
	 *     The original bug was NOT a broken helper — it was a helper that was
	 *     never called. The bulk senders need a live DB + mailer, so a fast unit
	 *     test cannot execute them; we assert the wiring statically instead, which
	 *     is what would have caught the regression in the first place.
	 * ----------------------------------------------------------------- */

	private function email_processing_source(): string {
		$path = dirname( __DIR__, 4 ) . '/includes/Modules/Campaigns/Campaign/EmailProcessing.php';
		$this->assertFileExists( $path );

		return (string) file_get_contents( $path );
	}

	public function test_every_bulk_sender_wires_click_tracking(): void {
		$source = $this->email_processing_source();

		// One click-tracking call per link-trigger call: the four bulk send paths
		// (curl_multi_standard, curl_multi_for_group, batch_for_group, batch_standard).
		$trigger_calls = substr_count( $source, 'inject_link_trigger_track_id_placeholder(' );
		$click_calls   = substr_count( $source, 'inject_bulk_click_tracking(' );

		$this->assertSame( 4, $trigger_calls, 'Expected 4 bulk send paths.' );
		$this->assertSame(
			$trigger_calls,
			$click_calls,
			'A bulk send path injects link-trigger track-ids but not click tracking — '
				. 'ordinary links in that path will not be tracked.'
		);
	}

	public function test_bulk_click_tracking_is_called_after_link_trigger_injection(): void {
		$source = $this->email_processing_source();

		// Order matters: triggers must claim their URLs before click tracking runs,
		// otherwise trigger links get wrapped and lose their hash.
		preg_match_all(
			'/inject_(link_trigger_track_id_placeholder|bulk_click_tracking)\(/',
			$source,
			$matches
		);

		$sequence = $matches[1];
		$this->assertCount( 8, $sequence );

		for ( $i = 0; $i < 8; $i += 2 ) {
			$this->assertSame( 'link_trigger_track_id_placeholder', $sequence[ $i ] );
			$this->assertSame( 'bulk_click_tracking', $sequence[ $i + 1 ] );
		}
	}

	public function test_bulk_click_tracking_receives_template_for_utm(): void {
		$source = $this->email_processing_source();

		// Passing $template is what keeps UTM parity with the non-bulk path.
		$this->assertSame(
			4,
			substr_count( $source, 'inject_bulk_click_tracking( $body, $template )' )
				+ substr_count( $source, 'inject_bulk_click_tracking( $rendered_body, $template )' ),
			'A bulk click-tracking call is missing its $template argument (UTM would be dropped).'
		);
	}

	/* -----------------------------------------------------------------
	 * 6. The get_tracking_class() dispatch path.
	 *
	 *    EmailProcessing.php:1814 and AbstractCampaignProcessing.php:1170 do:
	 *
	 *        $tracking_class = $this->get_tracking_class();   // Email::class
	 *        if ( method_exists( $tracking_class, 'add_click_tracking' ) ) { ... }
	 *
	 *    Tracking\Email is a standalone class — it does NOT extend AbstractTracking
	 *    (only Whatsapp/Sms do), so it has no add_click_tracking() at all. The guard
	 *    is therefore always false for email and the branch is dead code.
	 * ----------------------------------------------------------------- */

	public function test_tracking_email_class_does_not_extend_abstract_tracking(): void {
		$this->assertFalse(
			is_subclass_of( Email::class, '\DoubleScale\Modules\Tracking\Abstracts\AbstractTracking' ),
			'Tracking\Email is standalone; if this changes, the dead-branch tests below must be revisited.'
		);
	}

	/**
	 * BUG (dead branch): prepare_message_content() guards click tracking behind
	 * method_exists( Email::class, 'add_click_tracking' ), which is FALSE. So the
	 * builder-email path adds no click tracking at that point, and the branch has
	 * never executed for email.
	 *
	 * It survives only because send_message() (EmailProcessing.php:1990) calls
	 * EmailTrackingHelper::add_click_tracking() afterwards — so the non-bulk path
	 * is still tracked, by a different call. Bulk sends never reach send_message(),
	 * which is why they lose clicks entirely.
	 *
	 * If Email ever gains an add_click_tracking(), this dead branch wakes up and
	 * would double-wrap links on the non-bulk path. This test pins that risk.
	 */
	public function test_BUG_email_tracking_class_has_no_add_click_tracking_method(): void {
		$this->assertFalse(
			method_exists( Email::class, 'add_click_tracking' ),
			'Email gained add_click_tracking(); the guarded branch is now live and '
				. 'would double-wrap links alongside send_message(). Review both call sites.'
		);
	}

	/**
	 * Same guard, same dead branch, for the unsubscribe-link append.
	 */
	public function test_BUG_email_tracking_class_has_no_add_unsubscribe_link_method(): void {
		$this->assertFalse(
			method_exists( Email::class, 'add_unsubscribe_link' ),
			'Email gained add_unsubscribe_link(); the guarded branch is now live.'
		);
	}

	/**
	 * The AbstractTracking implementation that Sms/Whatsapp DO inherit rewrites any
	 * bare URL, including ones inside src="". Documented here to show why routing
	 * email through it (a tempting "fix" for the dead branch) would be wrong.
	 */
	public function test_abstract_tracking_regex_would_rewrite_image_src(): void {
		$this->assertTrue(
			method_exists( '\DoubleScale\Modules\Tracking\Whatsapp', 'add_click_tracking' ),
			'Whatsapp inherits the 2-arg tracker from AbstractTracking.'
		);

		$reflection = new \ReflectionMethod(
			'\DoubleScale\Modules\Tracking\Abstracts\AbstractTracking',
			'add_click_tracking'
		);

		// 2 params (message, hash_key) — no contact, no template, hence no UTM
		// and no link-trigger handling. Not interchangeable with the helper.
		$this->assertSame( 2, $reflection->getNumberOfParameters() );
	}
}
