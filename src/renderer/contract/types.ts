/**
 * Public contract DTO.
 */

export interface PublicContract {
	contract_number: string;
	subject: string;
	status: string;
	contract_value: number;
	currency: string;
	start_date: string | null;
	end_date: string | null;
	description: string;
	contract_type: { id: number; name: string } | null;
	is_expired: boolean;
	can_sign: boolean;
	require_signature: boolean;
	signed_name: string | null;
	signed_at: string | null;
	has_signature: boolean;
}
