<?php
/**
 * Merge-tag resolution must never abort an email send.
 *
 * Reported: including {{order:cross_sell}} or {{abandoned_cart:url}} in an
 * email makes the send fail. A merge tag resolves against whatever context the
 * message happens to carry, so a missing order, a deleted product, or a
 * campaign with no cart context is normal input — not a reason to lose the
 * email. Any tag that throws must degrade to an empty replacement.
 *
 * @package DoubleScale\Tests\Integration
 */

namespace DoubleScale\Tests\Integration\Modules\Emails;

use DoubleScale\Core\MergeTags\Abstracts\MergeTag;
use DoubleScale\Core\MergeTags\MergeTagsManager;
use DoubleScale\Tests\Integration\IntegrationTestCase;

/**
 * @group emails
 */
final class MergeTagFailureTest extends IntegrationTestCase {

	public function setUp(): void {
		parent::setUp();

		MergeTagsManager::instance()->register( new ThrowingMergeTag() );
		MergeTagsManager::instance()->register( new FatalMergeTag() );
	}

	/**
	 * An exception inside a tag must not escape into the send.
	 */
	public function test_throwing_merge_tag_does_not_abort_processing(): void {
		$out = MergeTagsManager::instance()->process_merge_tags(
			'Hello {{tests:throws}} world',
			null
		);

		$this->assertStringContainsString( 'Hello', $out );
		$this->assertStringContainsString( 'world', $out );
	}

	/**
	 * The real crash shape: calling a method on null, which is what
	 * OrderCrossSell did when wc_get_order() returned false or a product had
	 * been deleted. This is an \Error, not an \Exception.
	 */
	public function test_fatal_error_in_merge_tag_does_not_abort_processing(): void {
		$out = MergeTagsManager::instance()->process_merge_tags(
			'Before {{tests:fatal}} after',
			null
		);

		$this->assertStringContainsString( 'Before', $out );
		$this->assertStringContainsString( 'after', $out );
	}

	/**
	 * Surrounding content must survive intact — the failed tag alone is blanked.
	 */
	public function test_failed_tag_is_replaced_with_empty_string(): void {
		$out = MergeTagsManager::instance()->process_merge_tags(
			'[{{tests:fatal}}]',
			null
		);

		$this->assertSame( '[]', $out );
	}
}

/**
 * Test double: throws an exception from get_value().
 */
final class ThrowingMergeTag extends MergeTag {
	public $name        = 'Throws';
	public $slug        = 'throws';
	public $description = 'Test tag that throws';
	public $group       = 'tests';

	/**
	 * Non-automation, so get_tag_value() calls get_value() even with a null
	 * contact instead of short-circuiting to '' before the tag ever runs.
	 */
	public $is_automation = false;

	public function get_value( $contact, $merge_tag = '' ) {
		throw new \RuntimeException( 'merge tag blew up' );
	}
}

/**
 * Test double: triggers a fatal \Error, mirroring a null-object method call.
 */
final class FatalMergeTag extends MergeTag {
	public $name        = 'Fatal';
	public $slug        = 'fatal';
	public $description = 'Test tag that fatals';
	public $group       = 'tests';

	/**
	 * Non-automation, so get_tag_value() calls get_value() even with a null
	 * contact instead of short-circuiting to '' before the tag ever runs.
	 */
	public $is_automation = false;

	public function get_value( $contact, $merge_tag = '' ) {
		/** @var mixed $nothing */
		$nothing = null;
		return $nothing->get_name(); // Error: method call on null.
	}
}
