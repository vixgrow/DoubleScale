<?php
/**
 * Token replacement for sales email templates.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Sales\Models\ContractModel;
use DoubleScale\Modules\Sales\Models\InvoiceModel;
use DoubleScale\Modules\Sales\Models\ProposalModel;

/**
 * SalesEmailTokens helper.
 */
final class SalesEmailTokens {

	/**
	 * @param string               $text Template text.
	 * @param array<string, string> $tokens Token map.
	 * @return string
	 */
	public static function replace( string $text, array $tokens ): string {
		foreach ( $tokens as $key => $value ) {
			$text = str_replace( '{' . $key . '}', $value, $text );
		}
		return $text;
	}

	/**
	 * @param ProposalModel $proposal Proposal.
	 * @param string        $url Public URL.
	 * @return array<string, string>
	 */
	public static function for_proposal( ProposalModel $proposal, string $url ): array {
		$name = $proposal->to_name ? (string) $proposal->to_name : __( 'there', 'doublescale' );
		return array(
			'contact_name'     => $name,
			'subject'          => (string) $proposal->subject,
			'proposal_number'  => (string) $proposal->proposal_number,
			'total'            => number_format_i18n( (float) $proposal->total, 2 ) . ' ' . (string) $proposal->currency,
			'open_till'        => $proposal->open_till ? (string) $proposal->open_till : '',
			'proposal_link'    => $url,
			'company_name'     => (string) get_bloginfo( 'name' ),
		);
	}

	/**
	 * @param InvoiceModel $invoice Invoice.
	 * @param string       $url Public URL.
	 * @return array<string, string>
	 */
	public static function for_invoice( InvoiceModel $invoice, string $url ): array {
		$balance = max( 0, round( (float) $invoice->total - (float) $invoice->amount_paid, 2 ) );
		$name    = '';

		$invoice->loadMissing( 'contact' );
		if ( $invoice->contact ) {
			$name = trim( (string) $invoice->contact->first_name . ' ' . (string) $invoice->contact->last_name );
		}

		return array(
			'contact_name'   => '' !== $name ? $name : __( 'there', 'doublescale' ),
			'invoice_number' => (string) $invoice->invoice_number,
			'total'          => number_format_i18n( $balance, 2 ) . ' ' . (string) $invoice->currency,
			'due_date'       => $invoice->due_date ? (string) $invoice->due_date : '',
			'invoice_link'   => $url,
			'company_name'   => (string) get_bloginfo( 'name' ),
		);
	}

	/**
	 * @param ContractModel $contract Contract.
	 * @param string        $url Public URL.
	 * @return array<string, string>
	 */
	public static function for_contract( ContractModel $contract, string $url ): array {
		$name = __( 'there', 'doublescale' );
		$contract->loadMissing( 'contact' );
		if ( $contract->contact ) {
			$full = trim( (string) $contract->contact->first_name . ' ' . (string) $contract->contact->last_name );
			if ( '' !== $full ) {
				$name = $full;
			}
		}

		return array(
			'contact_name'      => $name,
			'subject'           => (string) $contract->subject,
			'contract_number'   => (string) $contract->contract_number,
			'contract_value'    => number_format_i18n( (float) $contract->contract_value, 2 ) . ' ' . (string) $contract->currency,
			'end_date'          => $contract->end_date ? (string) $contract->end_date : '',
			'contract_link'     => $url,
			'company_name'      => (string) get_bloginfo( 'name' ),
		);
	}
}
