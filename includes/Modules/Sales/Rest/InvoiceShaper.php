<?php
/**
 * Shape invoice models for REST responses.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Rest;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Sales\Constants\PaymentMode;
use DoubleScale\Modules\Sales\Models\InvoiceModel;

/**
 * InvoiceShaper class.
 */
class InvoiceShaper {

	/**
	 * @param InvoiceModel $invoice Invoice.
	 * @param bool         $with_relations Include relations.
	 * @return array
	 */
	public static function shape( InvoiceModel $invoice, bool $with_relations = false ): array {
		$data = array(
			'id'                    => (int) $invoice->id,
			'invoice_number'        => (string) $invoice->invoice_number,
			'hash'                  => (string) $invoice->hash,
			'status'                => (string) $invoice->status,
			'contact_id'            => (int) $invoice->contact_id,
			'proposal_id'           => $invoice->proposal_id ? (int) $invoice->proposal_id : null,
			'sale_agent_user_id'    => $invoice->sale_agent_user_id ? (int) $invoice->sale_agent_user_id : null,
			'invoice_date'          => $invoice->invoice_date,
			'due_date'              => $invoice->due_date,
			'currency'              => (string) $invoice->currency,
			'allowed_payment_modes' => PaymentMode::normalize_list( $invoice->allowed_payment_modes ),
			'discount_type'         => (string) $invoice->discount_type,
			'discount_value'        => (float) $invoice->discount_value,
			'tag_ids'               => is_array( $invoice->tag_ids ) ? array_values( array_map( 'intval', $invoice->tag_ids ) ) : array(),
			'line_items'            => is_array( $invoice->line_items ) ? $invoice->line_items : array(),
			'subtotal'              => (float) $invoice->subtotal,
			'total_tax'             => (float) $invoice->total_tax,
			'adjustment'            => (float) $invoice->adjustment,
			'total'                 => (float) $invoice->total,
			'amount_paid'           => (float) $invoice->amount_paid,
			'billing_address'       => $invoice->billing_address,
			'shipping_address'      => $invoice->shipping_address,
			'client_note'           => $invoice->client_note,
			'terms'                 => $invoice->terms,
			'created_at'            => $invoice->created_at,
			'updated_at'            => $invoice->updated_at,
		);

		if ( $with_relations ) {
			$contact = $invoice->relationLoaded( 'contact' ) ? $invoice->contact : null;
			if ( $contact ) {
				$data['contact'] = array(
					'id'         => (int) $contact->id,
					'email'      => (string) $contact->email,
					'first_name' => $contact->first_name,
					'last_name'  => $contact->last_name,
				);
			}
			$agent = $invoice->relationLoaded( 'sale_agent' ) ? $invoice->sale_agent : null;
			if ( $agent ) {
				$data['sale_agent'] = array(
					'id'           => (int) $agent->ID,
					'display_name' => (string) $agent->display_name,
					'email'        => (string) $agent->user_email,
				);
			}
			$proposal = $invoice->relationLoaded( 'proposal' ) ? $invoice->proposal : null;
			if ( $proposal ) {
				$data['proposal'] = array(
					'id'              => (int) $proposal->id,
					'proposal_number' => (string) $proposal->proposal_number,
					'subject'         => (string) $proposal->subject,
				);
			}
		}

		return $data;
	}
}
