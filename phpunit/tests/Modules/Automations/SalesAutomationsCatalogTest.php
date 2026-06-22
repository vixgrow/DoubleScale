<?php
/**
 * Sales (proposal/invoice) automation catalog, dependencies, and rules smoke tests.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Automations;

use DoubleScale\Modules\Automations\Rest\Controllers\RestAutomationController;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use ReflectionMethod;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class SalesAutomationsCatalogTest extends TestCase {

	private const EXPECTED_TRIGGER_SLUGS = array(
		'proposal_sent',
		'proposal_accepted',
		'proposal_declined',
		'proposal_converted_to_invoice',
		'invoice_sent',
		'invoice_paid',
		'contract_sent',
		'contract_signed',
		'credit_note_sent',
		'credit_note_applied',
	);

	private const EXPECTED_PROPOSAL_RULE_SLUGS = array(
		'proposal_status',
		'proposal_subject',
		'proposal_total',
		'proposal_number',
	);

	private const EXPECTED_INVOICE_RULE_SLUGS = array(
		'invoice_status',
		'invoice_total',
		'invoice_balance',
		'invoice_number',
	);

	private const EXPECTED_CONTRACT_RULE_SLUGS = array(
		'contract_status',
		'contract_subject',
		'contract_value',
		'contract_number',
	);

	private const EXPECTED_CREDIT_NOTE_RULE_SLUGS = array(
		'credit_note_status',
		'credit_note_total',
		'credit_note_remaining',
		'credit_note_number',
	);

	private const EXPECTED_MERGE_TAG_SLUGS = array(
		'proposal_number',
		'proposal_subject',
		'proposal_total',
		'proposal_url',
		'invoice_number',
		'invoice_total',
		'invoice_balance',
		'invoice_url',
		'contract_number',
		'contract_subject',
		'contract_value',
		'contract_url',
		'contract_end_date',
		'credit_note_number',
		'credit_note_total',
		'credit_note_remaining',
		'credit_note_url',
		'credit_note_status',
	);

	protected function setUp(): void {
		parent::setUp();
		$GLOBALS['__doublescale_phpunit_options']  = array();
		$GLOBALS['__doublescale_phpunit_filters']    = array();
		$GLOBALS['__doublescale_phpunit_hooks']      = array();
		$GLOBALS['__doublescale_phpunit_transients'] = array();
	}

	public function test_pro_automation_catalog_lists_sales_triggers(): void {
		if ( ! defined( 'DOUBLESCALE_PLUGIN_DIR' ) ) {
			$this->markTestSkipped( 'DOUBLESCALE_PLUGIN_DIR not defined.' );
		}

		$file = DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Config/ProAutomationCatalog.php';
		$this->assertFileExists( $file );

		$contents = (string) file_get_contents( $file );

		foreach ( self::EXPECTED_TRIGGER_SLUGS as $slug ) {
			$basename = $this->slug_to_class_basename( $slug );
			$this->assertStringContainsString(
				"Triggers\\Sales\\{$basename}::class",
				$contents,
				"Catalog missing sales trigger class reference: {$slug}"
			);
		}

		$this->assertStringNotContainsString(
			'Actions\\Sales\\',
			$contents,
			'Sales document actions should not be listed in the automation catalog.'
		);
	}

	public function test_free_sales_trigger_stubs_are_pro_gated(): void {
		if ( ! defined( 'DOUBLESCALE_PLUGIN_DIR' ) ) {
			$this->markTestSkipped( 'DOUBLESCALE_PLUGIN_DIR not defined.' );
		}
		if ( ! defined( 'DOUBLESCALE_PRO_PLUGIN_PATH' ) ) {
			define( 'DOUBLESCALE_PRO_PLUGIN_PATH', 'doublescale-pro/doublescale-pro.php' );
		}

		foreach ( self::EXPECTED_TRIGGER_SLUGS as $slug ) {
			$file = DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Triggers/Sales/' . $this->slug_to_class_basename( $slug ) . '.php';
			$this->assertFileExists( $file, "Missing free stub: {$file}" );
			$contents = (string) file_get_contents( $file );
			$this->assertStringContainsString( 'TriggerPro', $contents, "Stub {$slug} should extend TriggerPro." );
		}

		$trigger_pro = DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Abstracts/TriggerPro.php';
		$this->assertFileExists( $trigger_pro );
		$this->assertStringContainsString(
			'doublescale_is_pro_addon_active',
			(string) file_get_contents( $trigger_pro )
		);
	}

	public function test_rules_manager_declares_proposal_and_invoice_groups(): void {
		$file = DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Services/RulesManager.php';
		$this->assertFileExists( $file );
		$contents = (string) file_get_contents( $file );

		$this->assertStringContainsString( "'proposal'", $contents );
		$this->assertStringContainsString( "'invoice'", $contents );
		$this->assertStringContainsString( "'contract'", $contents );
		$this->assertStringContainsString( "'credit_note'", $contents );
		$this->assertStringContainsString( __( 'Proposal', 'doublescale' ), $contents );
		$this->assertStringContainsString( __( 'Invoice', 'doublescale' ), $contents );
		$this->assertStringContainsString( __( 'Contract', 'doublescale' ), $contents );
		$this->assertStringContainsString( __( 'Credit Note', 'doublescale' ), $contents );
		$this->assertStringContainsString( "'invoice_sent'", $contents );
		$this->assertStringContainsString( "'invoice_paid'", $contents );
	}

	public function test_proposal_rule_files_exist_in_pro_plugin(): void {
		$pro_root = dirname( DOUBLESCALE_PLUGIN_DIR ) . '/doublescale-pro/includes/Modules/Automations/Rules/';
		if ( ! is_dir( $pro_root ) ) {
			$this->markTestSkipped( 'Pro plugin rules directory not found.' );
		}

		foreach ( self::EXPECTED_PROPOSAL_RULE_SLUGS as $slug ) {
			$matches = glob( $pro_root . 'Proposal/' . $this->slug_to_class_basename( $slug ) . '.php' );
			$this->assertNotEmpty( $matches, "Missing proposal rule file for {$slug}" );
		}

		foreach ( self::EXPECTED_INVOICE_RULE_SLUGS as $slug ) {
			$matches = glob( $pro_root . 'Invoice/' . $this->slug_to_class_basename( $slug ) . '.php' );
			$this->assertNotEmpty( $matches, "Missing invoice rule file for {$slug}" );
		}

		foreach ( self::EXPECTED_CONTRACT_RULE_SLUGS as $slug ) {
			$matches = glob( $pro_root . 'Contract/' . $this->slug_to_class_basename( $slug ) . '.php' );
			$this->assertNotEmpty( $matches, "Missing contract rule file for {$slug}" );
		}

		foreach ( self::EXPECTED_CREDIT_NOTE_RULE_SLUGS as $slug ) {
			$matches = glob( $pro_root . 'CreditNote/' . $this->slug_to_class_basename( $slug ) . '.php' );
			$this->assertNotEmpty( $matches, "Missing credit note rule file for {$slug}" );
		}
	}

	public function test_sales_merge_tag_files_exist(): void {
		$document_slugs = array(
			'proposal_number',
			'proposal_subject',
			'proposal_total',
			'proposal_url',
			'invoice_number',
			'invoice_total',
			'invoice_balance',
			'invoice_url',
		);
		$contract_slugs = array(
			'contract_number',
			'contract_subject',
			'contract_value',
			'contract_url',
			'contract_end_date',
		);

		$documents_dir = DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Documents/MergeTags/';
		foreach ( $document_slugs as $slug ) {
			$matches = glob( $documents_dir . $this->slug_to_class_basename( $slug ) . '.php' );
			$this->assertNotEmpty( $matches, "Missing merge tag file for {$slug}" );
		}

		$contracts_dir = dirname( DOUBLESCALE_PLUGIN_DIR ) . '/doublescale-pro/includes/Modules/Contracts/MergeTags/';
		foreach ( $contract_slugs as $slug ) {
			$matches = glob( $contracts_dir . $this->slug_to_class_basename( $slug ) . '.php' );
			$this->assertNotEmpty( $matches, "Missing merge tag file for {$slug}" );
		}

		$credit_note_slugs = array(
			'credit_note_number',
			'credit_note_total',
			'credit_note_remaining',
			'credit_note_url',
			'credit_note_status',
		);
		$credit_notes_dir = dirname( DOUBLESCALE_PLUGIN_DIR ) . '/doublescale-pro/includes/Modules/CreditNotes/MergeTags/';
		foreach ( $credit_note_slugs as $slug ) {
			$matches = glob( $credit_notes_dir . $this->slug_to_class_basename( $slug ) . '.php' );
			$this->assertNotEmpty( $matches, "Missing merge tag file for {$slug}" );
		}

		$this->assertFileExists(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Sales/MergeTags/AbstractSalesMergeTag.php'
		);
	}

	public function test_sales_trigger_dependency_warns_when_pro_inactive(): void {
		if ( ! defined( 'DOUBLESCALE_PRO_PLUGIN_PATH' ) ) {
			define( 'DOUBLESCALE_PRO_PLUGIN_PATH', 'doublescale-pro/doublescale-pro.php' );
		}
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/functions.php';
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/ModuleFeatureGate.php';
		update_option( 'active_plugins', array() );
		update_option( 'doublescale_enabled_modules', array( 'sales' => true ) );
		if ( function_exists( 'doublescale_flush_module_enabled_cache' ) ) {
			doublescale_flush_module_enabled_cache();
		}

		$trigger         = new \stdClass();
		$trigger->source = 'sales';
		$trigger->group  = 'sales';
		$trigger->is_pro = true;

		$out = $this->invoke_dependency_check( 'check_trigger_plugin_dependency', $trigger );
		$this->assertTrue( (bool) ( $out['is_pro'] ?? false ) );
	}

	public function test_sales_trigger_dependency_warns_when_sales_module_off(): void {
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/functions.php';
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/ModuleFeatureGate.php';

		$stored = get_option( 'doublescale_enabled_modules', array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}
		$stored['sales'] = false;
		update_option( 'doublescale_enabled_modules', $stored );
		if ( function_exists( 'doublescale_flush_module_enabled_cache' ) ) {
			doublescale_flush_module_enabled_cache();
		}

		$trigger         = new \stdClass();
		$trigger->source = 'sales';
		$trigger->group  = 'sales';
		$trigger->is_pro = false;

		$out = $this->invoke_dependency_check( 'check_trigger_plugin_dependency', $trigger );
		$this->assertFalse( (bool) ( $out['is_active'] ?? true ) );
		$this->assertStringContainsString( 'Sales', (string) ( $out['message'] ?? '' ) );

		$stored['sales'] = true;
		update_option( 'doublescale_enabled_modules', $stored );
		if ( function_exists( 'doublescale_flush_module_enabled_cache' ) ) {
			doublescale_flush_module_enabled_cache();
		}
	}

	public function test_sales_action_dependency_warns_when_sales_module_off(): void {
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/functions.php';
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/ModuleFeatureGate.php';

		$stored = get_option( 'doublescale_enabled_modules', array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}
		$stored['sales'] = false;
		update_option( 'doublescale_enabled_modules', $stored );
		if ( function_exists( 'doublescale_flush_module_enabled_cache' ) ) {
			doublescale_flush_module_enabled_cache();
		}

		$action         = new \stdClass();
		$action->source = 'sales';
		$action->group  = 'sales';
		$action->is_pro = false;

		$out = $this->invoke_dependency_check( 'check_action_plugin_dependency', $action );
		$this->assertFalse( (bool) ( $out['is_active'] ?? true ) );
		$this->assertStringContainsString( 'Sales', (string) ( $out['message'] ?? '' ) );

		$stored['sales'] = true;
		update_option( 'doublescale_enabled_modules', $stored );
		if ( function_exists( 'doublescale_flush_module_enabled_cache' ) ) {
			doublescale_flush_module_enabled_cache();
		}
	}

	public function test_sales_trigger_dependency_warns_when_documents_module_off(): void {
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/functions.php';
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/ModuleFeatureGate.php';

		$stored            = get_option( 'doublescale_enabled_modules', array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}
		$stored['sales']     = true;
		$stored['documents'] = false;
		update_option( 'doublescale_enabled_modules', $stored );
		if ( function_exists( 'doublescale_flush_module_enabled_cache' ) ) {
			doublescale_flush_module_enabled_cache();
		}

		$trigger         = new \stdClass();
		$trigger->source = 'sales';
		$trigger->group  = 'sales';
		$trigger->slug   = 'proposal_sent';
		$trigger->is_pro = false;

		$out = $this->invoke_dependency_check( 'check_trigger_plugin_dependency', $trigger );
		$this->assertFalse( (bool) ( $out['is_active'] ?? true ) );
		$this->assertStringContainsString( 'Proposals & Invoices', (string) ( $out['message'] ?? '' ) );

		unset( $stored['documents'] );
		update_option( 'doublescale_enabled_modules', $stored );
		if ( function_exists( 'doublescale_flush_module_enabled_cache' ) ) {
			doublescale_flush_module_enabled_cache();
		}
	}

	public function test_condition_dependency_includes_proposal_and_invoice_groups(): void {
		$file = DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Automations/Rest/Controllers/RestAutomationController.php';
		$this->assertFileExists( $file );
		$contents = (string) file_get_contents( $file );

		$this->assertStringContainsString( "'proposal'", $contents );
		$this->assertStringContainsString( "'invoice'", $contents );
		$this->assertStringContainsString( "'contract'", $contents );
		$this->assertStringContainsString( "'credit_note'", $contents );
		$this->assertStringContainsString( "doublescale_automation_modules_available( array( 'sales', 'documents' ) )", $contents );
		$this->assertStringContainsString( "doublescale_automation_modules_available( array( 'sales', 'contracts' ) )", $contents );
		$this->assertStringContainsString( "doublescale_automation_modules_available( array( 'sales', 'credit_notes' ) )", $contents );
	}

	public function test_sales_trigger_dependency_warns_when_contracts_module_off(): void {
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/functions.php';
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/ModuleFeatureGate.php';

		$stored              = get_option( 'doublescale_enabled_modules', array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}
		$stored['sales']     = true;
		$stored['contracts'] = false;
		update_option( 'doublescale_enabled_modules', $stored );
		if ( function_exists( 'doublescale_flush_module_enabled_cache' ) ) {
			doublescale_flush_module_enabled_cache();
		}

		$trigger         = new \stdClass();
		$trigger->source = 'sales';
		$trigger->group  = 'contracts';
		$trigger->slug   = 'contract_sent';
		$trigger->is_pro = false;

		$out = $this->invoke_dependency_check( 'check_trigger_plugin_dependency', $trigger );
		$this->assertFalse( (bool) ( $out['is_active'] ?? true ) );
		$this->assertStringContainsString( 'Contracts', (string) ( $out['message'] ?? '' ) );

		unset( $stored['contracts'] );
		update_option( 'doublescale_enabled_modules', $stored );
		if ( function_exists( 'doublescale_flush_module_enabled_cache' ) ) {
			doublescale_flush_module_enabled_cache();
		}
	}

	/**
	 * @param string $method
	 * @param object $subject
	 * @return array<string, mixed>
	 */
	private function invoke_dependency_check( string $method, object $subject ): array {
		$ref  = new ReflectionClass( RestAutomationController::class );
		$ctrl = $ref->newInstanceWithoutConstructor();
		$m    = $ref->getMethod( $method );
		$m->setAccessible( true );

		/** @var array<string, mixed> $out */
		$out = $m->invoke( $ctrl, $subject );

		return $out;
	}

	private function slug_to_class_basename( string $slug ): string {
		$parts = explode( '_', $slug );
		$parts = array_map( 'ucfirst', $parts );

		return implode( '', $parts );
	}
}
