/**
 * Live template preview panel with sample document data.
 */

import React, { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { DocumentDesign } from './designs';
import { DocumentPreviewFrame } from './document-preview-frame';
import { getCompanyFrom } from './company-from';
import type { DocumentDesignDocType } from './designs/types';
import { normalizeTemplateId } from './registry';

const sampleLineItems = () => [
	{
		description: __('SaaS Landing page design', 'doublescale'),
		long_description: __('Home page design including hero section', 'doublescale'),
		qty: 1,
		rate: 500,
		tax: [],
	},
	{
		description: __('Brand identity', 'doublescale'),
		long_description: __('Logo and color palette', 'doublescale'),
		qty: 1,
		rate: 300,
		tax: [],
	},
];

interface TemplatePreviewPanelProps {
	docType: DocumentDesignDocType;
	templateId: number;
	accentColor?: string | null;
	className?: string;
}

export const TemplatePreviewPanel: React.FC<TemplatePreviewPanelProps> = ({
	docType,
	templateId,
	accentColor = null,
	className = '',
}) => {
	const isInvoice = docType === 'invoice';
	const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
	const dueDate = useMemo(() => {
		const d = new Date();
		d.setDate(d.getDate() + 30);
		return d.toISOString().slice(0, 10);
	}, []);

	const subtotal = 800;
	const total = 800;

	return (
		<div
			className={`rounded-xl border border-border bg-[#f8fafc] p-4 ${className}`}
		>
			<h3 className="mb-3 text-base font-semibold text-foreground">
				{__('Template Preview', 'doublescale')}
			</h3>
			<div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
				<div className="max-h-[min(58vh,560px)] overflow-x-hidden overflow-y-auto p-0">
					<DocumentPreviewFrame>
						<DocumentDesign
						template={normalizeTemplateId(templateId)}
						accentColor={accentColor}
						docType={docType}
						number={
							isInvoice
								? __('INV-00024', 'doublescale')
								: __('PRO-00024', 'doublescale')
						}
						subject={__('Sample project', 'doublescale')}
						from={getCompanyFrom()}
						statusBadges={[]}
						parties={[
							{
								label: isInvoice
									? __('Bill To', 'doublescale')
									: __('To', 'doublescale'),
								lines: [
									__('Client Name', 'doublescale'),
									__('123 Main Street', 'doublescale'),
									__('client@example.com', 'doublescale'),
								],
							},
						]}
						dates={
							isInvoice
								? [
										{
											label: __('Invoice Date', 'doublescale'),
											value: today,
										},
										{
											label: __('Due Date', 'doublescale'),
											value: dueDate,
										},
										{
											label: __('Currency', 'doublescale'),
											value: 'USD',
										},
									]
								: [
										{
											label: __('Date', 'doublescale'),
											value: today,
										},
										{
											label: __('Open Till', 'doublescale'),
											value: dueDate,
										},
										{
											label: __('Currency', 'doublescale'),
											value: 'USD',
										},
									]
						}
						lineItems={sampleLineItems()}
						currency="USD"
						showTax={isInvoice}
						subtotal={subtotal}
						totalTax={0}
						discountType="none"
						discountValue={0}
						adjustment={0}
						total={total}
						sections={[
							{
								title: __('Note', 'doublescale'),
								body: __('Thank you for your business.', 'doublescale'),
							},
						]}
					/>
					</DocumentPreviewFrame>
				</div>
			</div>
		</div>
	);
};
