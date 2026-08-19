<?php
/**
 * Integration tests for the send-invoice ability and the SendInvoice service.
 *
 * Sending an invoice is not "send an email" — it advances draft to unpaid,
 * snapshots the customer's billing details, freezes the issuer block and the
 * currency, stamps `sent_at`, writes an activity row, and fires
 * `doublescale_sales_invoice_sent`. The logic used to live in a private method
 * on RestInvoiceController; it was extracted to
 * {@see \DoubleScale\Modules\Documents\Services\SendInvoice} so the REST route
 * and the MCP ability perform an identical send.
 *
 * These tests assert the state transition and the money, not just a boolean:
 * a send that skipped the currency freeze would let a later global-currency
 * change silently restate what a customer already owes, and no structural test
 * can see that.
 *
 * @package DoubleScale\Tests\Integration\Core\Abilities
 */

namespace DoubleScale\Tests\Integration\Core\Abilities;

use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Modules\Documents\Abilities\DocumentAbilities;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Smtp\Settings as SmtpSettings;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class SendInvoiceAbilityTest extends IntegrationTestCase {

	/**
	 * Mails intercepted during a test.
	 *
	 * @var array<int, array<string, mixed>>
	 */
	private static $sent_mail = array();

	/**
	 * Payloads seen on `doublescale_sales_invoice_sent`.
	 *
	 * @var array<int, int>
	 */
	private static $sent_hook_invoice_ids = array();

	protected function setUp(): void {
		parent::setUp();

		self::$sent_mail             = array();
		self::$sent_hook_invoice_ids = array();

		add_filter(
			'pre_wp_mail',
			static function ( $short_circuit, $atts ) {
				self::$sent_mail[] = (array) $atts;
				return true;
			},
			10,
			2
		);

		add_action(
			'doublescale_sales_invoice_sent',
			static function ( $invoice ) {
				self::$sent_hook_invoice_ids[] = (int) $invoice->id;
			},
			10,
			1
		);

		// A send is refused outright unless the [doublescale_invoice] page
		// exists, because the email would otherwise link to nothing. Filtering
		// the resolved URL is cheaper and less brittle than publishing a page.
		add_filter(
			'doublescale_sales_invoice_page_url',
			static fn() => 'https://example.test/invoice'
		);

		$this->allow_ai_for( array( UserRoles::SALES_MANAGER, UserRoles::SALES_REP ) );
	}

	protected function tearDown(): void {
		self::$sent_mail             = array();
		self::$sent_hook_invoice_ids = array();
		parent::tearDown();
	}

	/**
	 * Put roles on the AI allow-list the ability gate consults.
	 *
	 * @param array<int, string> $roles Roles to permit.
	 * @return void
	 */
	private function allow_ai_for( array $roles ): void {
		$settings = (array) get_option( 'doublescale_settings', array() );

		$settings['ai'] = array_merge(
			(array) ( $settings['ai'] ?? array() ),
			array(
				'access' => array(
					'enabled'       => true,
					'allowed_roles' => array_merge( array( UserRoles::ADMINISTRATOR ), $roles ),
				),
			)
		);

		update_option( 'doublescale_settings', $settings );
	}

	/**
	 * An invoice owned by a given sales agent, with a contact that has an email.
	 *
	 * @param array<string, mixed> $overrides Column overrides.
	 * @return InvoiceModel
	 */
	private function make_invoice( array $overrides = array() ): InvoiceModel {
		$from_email = 'billing-' . wp_generate_password( 8, false, false ) . '@example.test';
		$this->register_smtp_connection( $from_email );

		$defaults = array(
			'contact_id'     => $this->make_contact(),
			'status'         => InvoiceStatus::DRAFT,
			'currency'       => 'USD',
			'discount_type'  => 'none',
			'discount_value' => 0,
			'line_items'     => array(
				array(
					'qty'    => 2,
					'rate'   => 150,
					'amount' => 300,
				),
			),
			'invoice_date'   => current_time( 'Y-m-d' ),
			'due_date'       => gmdate( 'Y-m-d', strtotime( '+30 days' ) ),
		);

		$invoice = new InvoiceModel();
		$invoice->fill( array_merge( $defaults, $overrides ) );
		$invoice->save();

		return $invoice->fresh();
	}

	/**
	 * Register an SMTP connection so outbound mail is not skipped.
	 *
	 * @param string $from_email Sending address.
	 * @return void
	 */
	private function register_smtp_connection( string $from_email ): void {
		$settings = (array) get_option( SmtpSettings::OPTION_NAME, array() );

		$connections = isset( $settings['connections'] ) && is_array( $settings['connections'] )
			? $settings['connections']
			: array();

		$connections[ 'conn-' . md5( $from_email ) ] = array(
			'from_email' => $from_email,
			'from_name'  => 'Billing',
			'mailer'     => 'php',
		);

		$settings['connections'] = $connections;
		update_option( SmtpSettings::OPTION_NAME, $settings );
	}

	/**
	 * The happy path, asserted on state rather than on the return flag alone.
	 */
	public function test_send_advances_draft_to_unpaid_and_stamps_sent_at(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SALES_MANAGER ) );
		wp_set_current_user( $manager );

		$invoice = $this->make_invoice();
		$this->assertSame( InvoiceStatus::DRAFT, (string) $invoice->status );
		$this->assertEmpty( $invoice->sent_at );

		$result = DocumentAbilities::send_invoice( array( 'id' => (int) $invoice->id ) );

		$this->assertIsArray( $result, 'Send failed: ' . ( is_wp_error( $result ) ? $result->get_error_message() : '' ) );
		$this->assertTrue( $result['sent'] );

		$fresh = InvoiceModel::query()->where( 'id', (int) $invoice->id )->first();

		$this->assertSame(
			InvoiceStatus::UNPAID,
			(string) $fresh->status,
			'Sending a draft invoice must advance it to unpaid.'
		);
		$this->assertNotEmpty( $fresh->sent_at, 'Sending must stamp sent_at.' );
	}

	/**
	 * The send must actually reach the customer, and the ability must report the
	 * address it used so an agent can tell the user who was contacted.
	 */
	public function test_send_emails_the_invoice_contact(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SALES_MANAGER ) );
		wp_set_current_user( $manager );

		$contact_id = $this->make_contact( array( 'email' => 'payer@example.test' ) );
		$invoice    = $this->make_invoice( array( 'contact_id' => $contact_id ) );

		$result = DocumentAbilities::send_invoice( array( 'id' => (int) $invoice->id ) );

		$this->assertIsArray( $result );
		$this->assertSame( 'payer@example.test', $result['emailed_to'] );
		$this->assertNotSame( array(), self::$sent_mail, 'send-invoice must actually email the customer.' );
	}

	/**
	 * THE money assertion: sending must not change what the customer owes.
	 *
	 * InvoiceModel recomputes totals from line_items on every save, and the send
	 * path saves. A regression that touched a field feeding TotalsCalculator
	 * would silently restate the amount on a document already in the customer's
	 * inbox.
	 */
	public function test_send_does_not_change_the_invoice_total(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SALES_MANAGER ) );
		wp_set_current_user( $manager );

		$invoice       = $this->make_invoice();
		$total_before  = (float) $invoice->total;

		$this->assertGreaterThan( 0.0, $total_before, 'Fixture must have a non-zero total to be meaningful.' );

		DocumentAbilities::send_invoice( array( 'id' => (int) $invoice->id ) );

		$fresh = InvoiceModel::query()->where( 'id', (int) $invoice->id )->first();

		$this->assertEqualsWithDelta(
			$total_before,
			(float) $fresh->total,
			0.001,
			'Sending an invoice must never change its total.'
		);
	}

	/**
	 * The currency freeze is what stops a later global-currency change from
	 * restating a sent invoice. An invoice saved without an explicit currency
	 * must come out of the send carrying one.
	 */
	public function test_send_freezes_a_currency_onto_the_invoice(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SALES_MANAGER ) );
		wp_set_current_user( $manager );

		$invoice = $this->make_invoice( array( 'currency' => '' ) );

		DocumentAbilities::send_invoice( array( 'id' => (int) $invoice->id ) );

		$fresh = InvoiceModel::query()->where( 'id', (int) $invoice->id )->first();

		$this->assertNotEmpty(
			$fresh->currency,
			'Sending must freeze a currency onto the invoice, or a later global change would restate it.'
		);
	}

	/**
	 * Other modules listen on this hook; a send that skipped it would leave
	 * their state inconsistent with the invoice.
	 */
	public function test_send_fires_the_invoice_sent_hook(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SALES_MANAGER ) );
		wp_set_current_user( $manager );

		$invoice = $this->make_invoice();

		DocumentAbilities::send_invoice( array( 'id' => (int) $invoice->id ) );

		$this->assertContains(
			(int) $invoice->id,
			self::$sent_hook_invoice_ids,
			'doublescale_sales_invoice_sent must fire so listening modules stay in sync.'
		);
	}

	/**
	 * A paid invoice must not be re-sent — the product refuses it, and so must
	 * the ability.
	 */
	public function test_paid_invoice_cannot_be_sent(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SALES_MANAGER ) );
		wp_set_current_user( $manager );

		$invoice = $this->make_invoice( array( 'status' => InvoiceStatus::PAID ) );

		$result = DocumentAbilities::send_invoice( array( 'id' => (int) $invoice->id ) );

		$this->assertTrue( is_wp_error( $result ), 'A paid invoice must not be sendable.' );
		$this->assertSame( 'invalid_status', $result->get_error_code() );
		$this->assertSame( array(), self::$sent_mail, 'A refused send must send no mail.' );
	}

	/**
	 * A contact with no email address must be refused BEFORE the status advances.
	 * Otherwise the invoice is left marked sent with nothing delivered.
	 */
	public function test_contact_without_an_email_is_refused_and_status_is_untouched(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SALES_MANAGER ) );
		wp_set_current_user( $manager );

		$contact_id = $this->make_contact( array( 'email' => null ) );
		$invoice    = $this->make_invoice( array( 'contact_id' => $contact_id ) );

		$result = DocumentAbilities::send_invoice( array( 'id' => (int) $invoice->id ) );

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_no_recipient', $result->get_error_code() );

		$fresh = InvoiceModel::query()->where( 'id', (int) $invoice->id )->first();
		$this->assertSame(
			InvoiceStatus::DRAFT,
			(string) $fresh->status,
			'A refused send must leave the invoice as a draft.'
		);
		$this->assertEmpty( $fresh->sent_at, 'A refused send must not stamp sent_at.' );
	}

	/**
	 * Gate 3: a rep must not send another rep's invoice.
	 */
	public function test_rep_cannot_send_another_reps_invoice(): void {
		$mine   = self::factory()->user->create( array( 'role' => UserRoles::SALES_REP ) );
		$theirs = self::factory()->user->create( array( 'role' => UserRoles::SALES_REP ) );

		$invoice = $this->make_invoice( array( 'sale_agent_user_id' => $theirs ) );

		wp_set_current_user( $mine );

		$result = DocumentAbilities::send_invoice( array( 'id' => (int) $invoice->id ) );

		$this->assertTrue( is_wp_error( $result ), 'A rep must not send an invoice owned by someone else.' );
		$this->assertSame( 'doublescale_forbidden', $result->get_error_code() );
		$this->assertSame( array(), self::$sent_mail );

		$fresh = InvoiceModel::query()->where( 'id', (int) $invoice->id )->first();
		$this->assertSame( InvoiceStatus::DRAFT, (string) $fresh->status );
	}

	/**
	 * A missing invoice is a 404, not a crash.
	 */
	public function test_unknown_invoice_is_refused(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SALES_MANAGER ) );
		wp_set_current_user( $manager );

		$result = DocumentAbilities::send_invoice( array( 'id' => 99999999 ) );

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_not_found', $result->get_error_code() );
	}

	/**
	 * A send with no invoice page configured must refuse rather than mail a link
	 * to nowhere. Asserted by removing the filter the other tests rely on.
	 */
	public function test_send_is_refused_when_no_invoice_page_exists(): void {
		$manager = self::factory()->user->create( array( 'role' => UserRoles::SALES_MANAGER ) );
		wp_set_current_user( $manager );

		$invoice = $this->make_invoice();

		remove_all_filters( 'doublescale_sales_invoice_page_url' );
		add_filter( 'doublescale_sales_invoice_page_url', static fn() => '' );
		delete_transient( 'doublescale_sales_invoice_page_url' );

		$result = DocumentAbilities::send_invoice( array( 'id' => (int) $invoice->id ) );

		$this->assertTrue( is_wp_error( $result ), 'Sending without a public invoice page must be refused.' );
		$this->assertSame( 'no_invoice_page', $result->get_error_code() );
		$this->assertSame( array(), self::$sent_mail );
	}
}
