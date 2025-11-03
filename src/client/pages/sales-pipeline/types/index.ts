/**
 * Shared types for the sales pipeline module
 */
import { CustomField } from '../../../types';

// Re-export CustomField for use in components
export type { CustomField };

export interface Deal {
	id: number;
	title: string;
	value: number;
	currency: string;
	probability: number | null;
	priority: string | null;
	status: string;
	expected_close_date: string | null;
	is_overdue: boolean;
	days_until_close: number | null;
	weighted_value: number;
	source: string | null;
	lost_reason: string | null;
	won_time: string | null;
	lost_time: string | null;
	created_at: string;
	updated_at: string;
	contact: {
		id: number;
		first_name: string;
		last_name: string;
		email: string;
	} | null;
	pipeline: {
		id: number;
		name: string;
	} | null;
	stage: {
		id: number;
		name: string;
		color: string;
		win_probability: number;
	} | null;
	owner: {
		id: number;
		display_name: string;
		email: string;
	} | null;
	custom_fields: CustomField[];
}

export interface Pipeline {
	id: number;
	name: string;
	description: string;
	stages: Array<{
		id: number;
		name: string;
		color: string;
		sort_order: number;
		win_probability: number;
		total_value?: number;
		deal_count?: number;
	}>;
}

export interface Filters {
	search: string;
	ownerId: number | null;
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
	status: 'open' | 'won' | 'lost' | 'all';
	priority: string | null;
}
