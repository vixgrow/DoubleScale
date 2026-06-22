<?php
/**
 * Resolve {{group:slug}} merge tags in sales customer emails.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\MergeTags\MergeTagsManager;
use DoubleScale\Modules\Automations\Models\AutomationContactModel;
use DoubleScale\Modules\Contacts\Models\ContactModel;

/**
 * SalesEmailMergeTags helper.
 */
final class SalesEmailMergeTags {

	/**
	 * Replace merge tags when a contact context is available.
	 *
	 * @param string                         $content Content with optional merge tags.
	 * @param AutomationContactModel|null    $context Automation contact context.
	 * @return string
	 */
	public static function resolve( string $content, ?AutomationContactModel $context ): string {
		if ( '' === $content || null === $context || false === strpos( $content, '{{' ) ) {
			return $content;
		}

		return MergeTagsManager::instance()->process_merge_tags( $content, $context );
	}

	/**
	 * Build merge-tag context from a linked contact.
	 *
	 * @param ContactModel|null $contact Linked contact, if any.
	 * @param array<string, int|string> $data Optional context data (e.g. document ids).
	 * @return AutomationContactModel
	 */
	public static function context_from_contact( ?ContactModel $contact, array $data = array() ): AutomationContactModel {
		$context             = new AutomationContactModel();
		$context->contact_id = $contact ? (int) $contact->id : 0;

		if ( ! empty( $data ) ) {
			$context->data = $data;
		}

		if ( $contact instanceof ContactModel ) {
			$context->setRelation( 'contact', $contact );
		}

		return $context;
	}
}
