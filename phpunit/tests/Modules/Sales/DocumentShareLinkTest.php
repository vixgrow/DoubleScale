<?php
/**
 * WhatsApp share payload construction for sales documents.
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Sales\Services\DocumentShareLink;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( __NAMESPACE__ . '\\wp_parse_url_query' ) ) {
	/**
	 * Query string of a URL (wp_parse_url is not stubbed in the fast suite).
	 *
	 * @param string $url URL.
	 * @return string
	 */
	function wp_parse_url_query( string $url ): string {
		return (string) parse_url( $url, PHP_URL_QUERY );
	}
}

/**
 * @group smoke
 */
final class DocumentShareLinkTest extends TestCase {

	/**
	 * Invoke a private static helper.
	 *
	 * @param string $name Method name.
	 * @param array  $args Arguments.
	 * @return mixed
	 */
	private function call( string $name, array $args ) {
		$method = new ReflectionMethod( DocumentShareLink::class, $name );
		$method->setAccessible( true );

		return $method->invokeArgs( null, $args );
	}

	public function test_deep_link_without_phone_opens_contact_picker(): void {
		$link = DocumentShareLink::deep_link( array( 'phone' => '', 'text' => '' ) );

		$this->assertSame( 'https://wa.me/', $link );
	}

	public function test_deep_link_strips_non_digits_from_phone(): void {
		$link = DocumentShareLink::deep_link( array( 'phone' => '+20 (100) 123-4567', 'text' => '' ) );

		$this->assertSame( 'https://wa.me/201001234567', $link );
	}

	/**
	 * The message must be encoded exactly once — pre-encoding before
	 * add_query_arg() would double-escape every space and newline.
	 */
	public function test_deep_link_encodes_message_once(): void {
		$link = DocumentShareLink::deep_link(
			array(
				'phone' => '201001234567',
				'text'  => "Hello Ahmed\nhttps://example.test/?doublescale_invoice_hash=abc",
			)
		);

		$this->assertStringContainsString( 'https://wa.me/201001234567?', $link );
		$this->assertStringNotContainsString( '%250A', $link, 'Message was encoded twice.' );

		parse_str( (string) wp_parse_url_query( $link ), $query );
		$this->assertSame(
			"Hello Ahmed\nhttps://example.test/?doublescale_invoice_hash=abc",
			$query['text']
		);
	}

	public function test_default_templates_exist_for_every_supported_type(): void {
		foreach ( DocumentShareLink::TYPES as $type ) {
			$template = $this->call( 'default_template', array( $type ) );

			$this->assertNotSame( '', $template, "Missing template for {$type}." );
			$this->assertStringContainsString( '{{contact:first_name}}', $template );
		}
	}

	/**
	 * Every template must state the amount up front, so the recipient sees it
	 * in the WhatsApp preview without opening the link.
	 */
	public function test_default_templates_include_number_amount_and_date(): void {
		$expected = array(
			'invoice'     => array( 'invoice_number', 'invoice_total', 'invoice_due_date' ),
			'proposal'    => array( 'proposal_number', 'proposal_total', 'proposal_open_till' ),
			'credit_note' => array( 'credit_note_number', 'credit_note_total', 'credit_note_date' ),
			'contract'    => array( 'contract_number', 'contract_value', 'contract_end_date' ),
		);

		foreach ( $expected as $type => $slugs ) {
			$template = $this->call( 'default_template', array( $type ) );

			foreach ( $slugs as $slug ) {
				$this->assertStringContainsString(
					'{{sales:' . $slug . '}}',
					$template,
					"{$type} template is missing {$slug}."
				);
			}
		}
	}

	/**
	 * A document with no due date must not ship a dangling "Due date:" line.
	 */
	public function test_tidy_drops_label_lines_with_no_value(): void {
		$body = "Hello Ahmed,\n\nYour invoice INV-001 for $1,200 is ready.\nDue date:\n\nYou can view and pay it here:";

		$tidied = $this->call( 'tidy', array( $body ) );

		$this->assertStringNotContainsString( 'Due date:', $tidied );
	}

	/**
	 * tidy() removes empty labels, but the closing call-to-action also ends in
	 * a colon and must survive — it introduces the link that follows.
	 */
	public function test_tidy_keeps_the_closing_call_to_action(): void {
		$body = "Hello Ahmed,\n\nYour invoice INV-001 for $1,200 is ready.\nDue date:\n\nYou can view and pay it here:";

		$tidied = $this->call( 'tidy', array( $body ) );

		$this->assertStringContainsString( 'You can view and pay it here:', $tidied );
		$this->assertStringContainsString( 'INV-001', $tidied );
	}

	public function test_tidy_collapses_blank_runs(): void {
		$tidied = $this->call( 'tidy', array( "One\n\n\n\n\nTwo" ) );

		$this->assertSame( "One\n\nTwo", $tidied );
	}

	public function test_unknown_type_has_no_template(): void {
		$this->assertSame( '', $this->call( 'default_template', array( 'purchase_order' ) ) );
	}

	public function test_unknown_type_resolves_no_public_url(): void {
		$this->assertSame(
			'',
			DocumentShareLink::public_url( (object) array( 'id' => 1 ), 'purchase_order' )
		);
	}

	public function test_has_public_page_is_false_for_unknown_type(): void {
		$this->assertFalse( DocumentShareLink::has_public_page( 'purchase_order' ) );
	}

	/**
	 * A document with no contact relation must degrade to the contact picker
	 * rather than raising.
	 */
	public function test_recipient_phone_is_empty_without_a_contact(): void {
		$this->assertSame( '', DocumentShareLink::recipient_phone( (object) array( 'id' => 7 ) ) );
	}

	/**
	 * Document stub carrying a contact, mimicking a loaded Eloquent relation.
	 *
	 * @param array<string, mixed> $attributes Contact attributes.
	 * @return object
	 */
	private function document_with_contact( array $attributes ) {
		$contact = new ContactModel();
		foreach ( $attributes as $key => $value ) {
			$contact->{$key} = $value;
		}

		return (object) array(
			'id'      => 1,
			'contact' => $contact,
		);
	}

	public function test_recipient_phone_prefers_the_dedicated_whatsapp_number(): void {
		$document = $this->document_with_contact(
			array(
				'whatsapp_phone' => '+201001234567',
				'phone'          => '+201119999999',
			)
		);

		$this->assertSame( '201001234567', DocumentShareLink::recipient_phone( $document ) );
	}

	/**
	 * Most contacts only have the general phone filled in, so it has to work as
	 * the fallback — matching the behaviour digages relies on.
	 */
	public function test_recipient_phone_falls_back_to_the_general_phone(): void {
		$document = $this->document_with_contact(
			array(
				'whatsapp_phone' => '',
				'phone'          => '+20 (100) 123-4567',
			)
		);

		$this->assertSame( '201001234567', DocumentShareLink::recipient_phone( $document ) );
	}

	public function test_recipient_phone_is_empty_when_the_contact_has_no_number(): void {
		$document = $this->document_with_contact(
			array(
				'whatsapp_phone' => '',
				'phone'          => '',
			)
		);

		$this->assertSame( '', DocumentShareLink::recipient_phone( $document ) );
	}

	/**
	 * wa.me rejects "+" and separators in the path segment.
	 */
	public function test_recipient_phone_is_reduced_to_digits(): void {
		$document = $this->document_with_contact( array( 'whatsapp_phone' => '+20 100 123 4567' ) );

		$this->assertMatchesRegularExpression(
			'/^\d+$/',
			DocumentShareLink::recipient_phone( $document )
		);
	}
}
