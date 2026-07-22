/**
 * Document template metadata and helpers.
 */

import { __ } from '@wordpress/i18n';

import invoice1 from '@doublescale/assets/images/sales-templates/invoice-1.png';
import invoice2 from '@doublescale/assets/images/sales-templates/invoice-2.png';
import invoice3 from '@doublescale/assets/images/sales-templates/invoice-3.png';
import invoice4 from '@doublescale/assets/images/sales-templates/invoice-4.png';
import invoice5 from '@doublescale/assets/images/sales-templates/invoice-5.png';
import invoice6 from '@doublescale/assets/images/sales-templates/invoice-6.png';
import invoice7 from '@doublescale/assets/images/sales-templates/invoice-7.png';
import invoice8 from '@doublescale/assets/images/sales-templates/invoice-8.png';
import proposal1 from '@doublescale/assets/images/sales-templates/proposal-1.png';
import proposal2 from '@doublescale/assets/images/sales-templates/proposal-2.png';
import proposal3 from '@doublescale/assets/images/sales-templates/proposal-3.png';
import proposal4 from '@doublescale/assets/images/sales-templates/proposal-4.png';
import proposal5 from '@doublescale/assets/images/sales-templates/proposal-5.png';
import proposal6 from '@doublescale/assets/images/sales-templates/proposal-6.png';
import proposal7 from '@doublescale/assets/images/sales-templates/proposal-7.png';
import proposal8 from '@doublescale/assets/images/sales-templates/proposal-8.png';

export const DEFAULT_TEMPLATE_ID = 1;
export const MIN_TEMPLATE_ID = 1;
export const MAX_TEMPLATE_ID = 8;

export interface DocumentTemplateMeta {
	id: number;
	name: string;
	invoiceThumb: string;
	proposalThumb: string;
}

export const DOCUMENT_TEMPLATES: DocumentTemplateMeta[] = [
	{
		id: 1,
		name: __('Classic', 'doublescale'),
		invoiceThumb: invoice1,
		proposalThumb: proposal1,
	},
	{
		id: 2,
		name: __('Ocean Corners', 'doublescale'),
		invoiceThumb: invoice2,
		proposalThumb: proposal2,
	},
	{
		id: 3,
		name: __('Corner Frame', 'doublescale'),
		invoiceThumb: invoice3,
		proposalThumb: proposal3,
	},
	{
		id: 4,
		name: __('Gold Wave', 'doublescale'),
		invoiceThumb: invoice4,
		proposalThumb: proposal4,
	},
	{
		id: 5,
		name: __('Soft Line', 'doublescale'),
		invoiceThumb: invoice5,
		proposalThumb: proposal5,
	},
	{
		id: 6,
		name: __('Boxed', 'doublescale'),
		invoiceThumb: invoice6,
		proposalThumb: proposal6,
	},
	{
		id: 7,
		name: __('Title Bar', 'doublescale'),
		invoiceThumb: invoice7,
		proposalThumb: proposal7,
	},
	{
		id: 8,
		name: __('Side Tab', 'doublescale'),
		invoiceThumb: invoice8,
		proposalThumb: proposal8,
	},
];

export const normalizeTemplateId = (value: unknown): number => {
	const id = Number(value);
	if (!Number.isFinite(id) || id < MIN_TEMPLATE_ID || id > MAX_TEMPLATE_ID) {
		return DEFAULT_TEMPLATE_ID;
	}
	return Math.trunc(id);
};

export const getTemplateMeta = (id: unknown): DocumentTemplateMeta => {
	const normalized = normalizeTemplateId(id);
	return (
		DOCUMENT_TEMPLATES.find((tpl) => tpl.id === normalized) ||
		DOCUMENT_TEMPLATES[0]
	);
};
