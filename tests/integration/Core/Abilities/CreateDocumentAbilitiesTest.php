<?php
/**
 * Integration tests for creating sales documents and sending proposals.
 *
 * @package DoubleScale\Tests\Integration\Core\Abilities
 */

namespace DoubleScale\Tests\Integration\Core\Abilities;

use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Modules\Documents\Abilities\DocumentAbilities;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Constants\ProposalStatus;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Documents\Models\ProposalModel;
use DoubleScale\Modules\Smtp\Settings as SmtpSettings;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class CreateDocumentAbilitiesTest extends IntegrationTestCase {

	/**
	 * @var array<int, array<string, mixed>>
	 */
	private static $sent_mail = array();

	protected function setUp(): void {
		parent::setUp();

		self::$sent_mail = array();

		add_filter(
			'pre_wp_mail',
			static function ( $short_circuit, $atts ) {
				self::$sent_mail[] = (array) $atts;
				return true;
			},
			10,
			2
		);

		add_filter(
			'doublescale_sales_proposal_page_url',
			static function () {
				return 'https://example.test/proposal';
			}
		);

		$settings = (array) get_option( 'doublescale_settings', array() );
		$settings['ai'] = array_merge(
			(array) ( $settings['ai'] ?? array() ),
			array(
				'access' => array(
					'enabled'       => true,
					'allowed_roles' => array( UserRoles::ADMINISTRATOR, UserRoles::SALES_MANAGER, UserRoles::SALES_REP ),
				),
			)
		);
		update_option( 'doublescale_settings', $settings );

		wp_set_current_user( self::factory()->user->create( array( 'role' => UserRoles::SALES_MANAGER ) ) );
	}

	protected function tearDown(): void {
		self::$sent_mail = array();
		parent::tearDown();
	}

	public function test_create_invoice_is_a_draft_with_computed_total_and_does_not_send(): void {
		$result = DocumentAbilities::create_invoice(
			array(
				'contact_id' => $this->make_contact(),
				'line_items' => array(
					array(
						'description' => 'Setup',
						'qty'         => 2,
						'rate'        => 150,
					),
				),
			)
		);

		$this->assertIsArray( $result, is_wp_error( $result ) ? $result->get_error_message() : '' );
		$this->assertTrue( $result['created'] );
		$this->assertFalse( $result['sent'] );
		$this->assertSame( InvoiceStatus::DRAFT, $result['status'] );
		$this->assertEqualsWithDelta( 300.0, (float) $result['total'], 0.001 );
		$this->assertSame( array(), self::$sent_mail, 'create-invoice must never email the customer.' );

		$invoice = InvoiceModel::query()->where( 'id', (int) $result['invoice_id'] )->first();
		$this->assertSame( InvoiceStatus::DRAFT, (string) $invoice->status );
	}

	public function test_create_proposal_is_a_draft_and_does_not_send(): void {
		$result = DocumentAbilities::create_proposal(
			array(
				'contact_id' => $this->make_contact(),
				'subject'    => 'Website rebuild',
				'line_items' => array(
					array(
						'description' => 'Design',
						'qty'         => 1,
						'rate'        => 900,
					),
				),
			)
		);

		$this->assertIsArray( $result, is_wp_error( $result ) ? $result->get_error_message() : '' );
		$this->assertTrue( $result['created'] );
		$this->assertFalse( $result['sent'] );
		$this->assertSame( ProposalStatus::DRAFT, $result['status'] );
		$this->assertSame( array(), self::$sent_mail );
	}

	public function test_send_proposal_emails_the_contact_and_advances_draft(): void {
		$from_email = 'quotes-' . wp_generate_password( 8, false, false ) . '@example.test';
		$this->register_smtp_connection( $from_email );

		$contact_id = $this->make_contact( array( 'email' => 'buyer@example.test' ) );
		$created    = DocumentAbilities::create_proposal(
			array(
				'contact_id' => $contact_id,
				'subject'    => 'Retainer',
				'line_items' => array(
					array(
						'qty'  => 1,
						'rate' => 250,
					),
				),
			)
		);

		$this->assertIsArray( $created );
		$total_before = (float) $created['total'];

		$sent = DocumentAbilities::send_proposal( array( 'id' => (int) $created['proposal_id'] ) );

		$this->assertIsArray( $sent, is_wp_error( $sent ) ? $sent->get_error_message() : '' );
		$this->assertTrue( $sent['sent'] );
		$this->assertSame( 'buyer@example.test', $sent['emailed_to'] );
		$this->assertSame( ProposalStatus::SENT, $sent['status'] );
		$this->assertNotSame( array(), self::$sent_mail, 'send-proposal must email the customer.' );

		$fresh = ProposalModel::query()->where( 'id', (int) $created['proposal_id'] )->first();
		$this->assertSame( ProposalStatus::SENT, (string) $fresh->status );
		$this->assertNotEmpty( $fresh->sent_at );
		$this->assertEqualsWithDelta( $total_before, (float) $fresh->total, 0.001, 'Sending must not change the total.' );
	}

	/**
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
			'from_name'  => 'Quotes',
			'mailer'     => 'php',
		);

		$settings['connections'] = $connections;
		update_option( SmtpSettings::OPTION_NAME, $settings );
	}
}
