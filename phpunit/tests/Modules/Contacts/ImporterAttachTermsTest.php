<?php
/**
 * Regression test for CSV/import list & tag assignment.
 *
 * Bug: the importer assigned lists/tags via $contact->lists()->syncWithPivotValues(),
 * a method the bundled Eloquent port does not implement. The call threw, was
 * swallowed by import_contact()'s try/catch, and the chosen list/tag was never
 * applied — contacts imported but had to be assigned manually.
 *
 * Fix: attach_contact_terms() normalises the IDs, dedupes against current
 * terms, and uses the supported attach() primitive.
 *
 * @package DoubleScale\Tests\Modules\Contacts
 */

namespace DoubleScale\Tests\Modules\Contacts;

use DoubleScale\Modules\Contacts\ImportExport\Importers\Csv;
use DoubleScale\Modules\Contacts\Abstracts\Importer;
use PHPUnit\Framework\TestCase;

/** Minimal pluck()->all() stand-in for the loaded relation collection. */
final class FakeTermCollection {
	/** @var int[] */
	private array $ids;

	public function __construct( array $ids ) {
		$this->ids = $ids;
	}

	public function pluck( $key ) {
		return $this; // key is always 'id' here.
	}

	public function all(): array {
		return $this->ids;
	}
}

/** Records attach() calls so the test can assert what was attached. */
final class FakeRelation {
	/** @var array<int, array{0: array, 1: array}> */
	public array $attached = array();

	public function attach( $ids, array $attributes = array() ): void {
		$this->attached[] = array( $ids, $attributes );
	}
}

/** Fake contact exposing both a `lists` property and a `lists()` method. */
final class FakeContact {
	public FakeTermCollection $lists;
	public FakeTermCollection $tags;
	public FakeRelation $listsRelation;
	public FakeRelation $tagsRelation;

	public function __construct( array $existing_list_ids = array(), array $existing_tag_ids = array() ) {
		$this->lists         = new FakeTermCollection( $existing_list_ids );
		$this->tags          = new FakeTermCollection( $existing_tag_ids );
		$this->listsRelation = new FakeRelation();
		$this->tagsRelation  = new FakeRelation();
	}

	public function lists(): FakeRelation {
		return $this->listsRelation;
	}

	public function tags(): FakeRelation {
		return $this->tagsRelation;
	}

	public function unsetRelation( $name ): void {
		// No-op: tests cover single attach calls per relation.
	}
}

final class ImporterAttachTermsTest extends TestCase {

	private function invoke( FakeContact $contact, string $relation, $ids, string $type ): void {
		$importer = ( new \ReflectionClass( Csv::class ) )->newInstanceWithoutConstructor();
		$method   = new \ReflectionMethod( Importer::class, 'attach_contact_terms' );
		$method->setAccessible( true );
		$method->invoke( $importer, $contact, $relation, $ids, $type );
	}

	public function test_attaches_chosen_lists_with_taxonomy_type(): void {
		$contact = new FakeContact();

		$this->invoke( $contact, 'lists', array( 3, 5 ), 'list' );

		$this->assertCount( 1, $contact->listsRelation->attached );
		$this->assertSame( array( 3, 5 ), $contact->listsRelation->attached[0][0] );
		$this->assertSame( array( 'taxonomy_type' => 'list' ), $contact->listsRelation->attached[0][1] );
	}

	public function test_attaches_chosen_tags_with_taxonomy_type(): void {
		$contact = new FakeContact();

		$this->invoke( $contact, 'tags', array( 9 ), 'tag' );

		$this->assertCount( 1, $contact->tagsRelation->attached );
		$this->assertSame( array( 9 ), $contact->tagsRelation->attached[0][0] );
		$this->assertSame( array( 'taxonomy_type' => 'tag' ), $contact->tagsRelation->attached[0][1] );
	}

	public function test_normalises_and_dedupes_ids_and_skips_existing(): void {
		// Existing list 5; incoming has dupes, a 0, a string, and the existing 5.
		$contact = new FakeContact( array( 5 ) );

		$this->invoke( $contact, 'lists', array( 5, 7, 7, 0, '8' ), 'list' );

		$this->assertCount( 1, $contact->listsRelation->attached );
		// 5 already attached, 0 filtered out, '8' coerced, 7 deduped.
		$this->assertSame( array( 7, 8 ), $contact->listsRelation->attached[0][0] );
	}

	public function test_does_not_attach_when_all_ids_already_present(): void {
		$contact = new FakeContact( array( 1, 2, 3 ) );

		$this->invoke( $contact, 'lists', array( 1, 2, 3 ), 'list' );

		$this->assertSame( array(), $contact->listsRelation->attached );
	}

	public function test_does_not_attach_when_ids_empty(): void {
		$contact = new FakeContact();

		$this->invoke( $contact, 'lists', array(), 'list' );

		$this->assertSame( array(), $contact->listsRelation->attached );
	}
}
