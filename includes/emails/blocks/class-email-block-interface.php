<?php
// includes/emails/blocks/interface-email-block.php

namespace QuillCRM\Emails\Blocks;

use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Interface for all email blocks
 */
interface Email_Block_Interface {
	/**
	 * Get block type identifier
	 *
	 * @return string
	 */
	public function get_type(): string;

	/**
	 * Get block name
	 *
	 * @return string
	 */
	public function get_name(): string;

	/**
	 * Render block for email
	 *
	 * @param array                                    $props Block properties
	 * @param Contact_Model|Automation_Contact_Model|null $contact Contact model for merge tags
	 * @return string HTML output
	 */
	public function render( array $props, $contact = null ): string;

	/**
	 * Get default properties for the block
	 *
	 * @return array
	 */
	public function get_default_props(): array;
}
