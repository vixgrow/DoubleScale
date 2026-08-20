/**
 * Approval workflow settings (Pro) — mirrors payment-gateways-settings layout.
 */

import React from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { ListChecks } from 'lucide-react';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { canApproveSalesDocuments } from '@/components/sales/sales-approval-utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useApprovalQueue } from '@/hooks/sales';
import type { SalesSettings } from '@/types/sales';
import { SettingsApprovalsIcon, ExternalLinkIcon } from '@doublescale/components';

interface ApprovalWorkflowSettingsProps {
	form: SalesSettings;
	patch: (key: keyof SalesSettings, value: SalesSettings[keyof SalesSettings]) => void;
}

export const ApprovalWorkflowSettings: React.FC<ApprovalWorkflowSettingsProps> = ({
	form,
	patch,
}) => {
	const navigate = useNavigate();
	const enabled = Boolean(form.approval_workflow_enabled);
	const canReview = canApproveSalesDocuments();
	const { meta, loading: queueLoading } = useApprovalQueue(1, 1);
	const pendingCount = enabled ? meta.total : 0;

	return (
		<div className="space-y-6">
			<section className="space-y-4 border rounded-lg bg-[#F7F8FA] p-6">
				<div className="min-w-0 space-y-1">
					<div className="flex items-center gap-3">
						<div className="flex p-1.5 shrink-0 items-center justify-center rounded-full bg-white border border-border text-[#0D9DFC]">
							<SettingsApprovalsIcon width={20} height={22} />
						</div>
						<h2 className="text-base lg:text-xl font-semibold text-foreground">
							{__('Approval workflow', 'doublescale')}
						</h2>
					</div>
					<p className="pl-[52px] lg:text-base text-sm text-muted-foreground">
						{__(
							'Control whether sales reps must get manager approval before sending proposals, invoices, contracts, and credit notes to customers.',
							'doublescale'
						)}
					</p>
				</div>
				<div className="border rounded-lg p-4 space-y-3 bg-white">
					<div className="flex flex-col sm:flex-row items-start sm:justify-between justify-start gap-4">
						<div className="space-y-1 min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<h3 className="font-medium">
									{__(
										'Internal document approval',
										'doublescale'
									)}
								</h3>
								{enabled ? (
									<Badge
										variant="default"
										className="text-sm shadow-none text-white bg-green-600"
									>
										{__('Enabled', 'doublescale')}
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="text-sm shadow-none border-muted bg-muted text-muted-foreground"
									>
										{__('Disabled', 'doublescale')}
									</Badge>
								)}
								{enabled &&
								canReview &&
								!queueLoading &&
								pendingCount > 0 ? (
									<Badge
										variant="outline"
										className="text-sm shadow-none text-[#896900] bg-[#F7F4C3]"
									>
										{sprintf(
											/* translators: %d: number of documents awaiting approval */
											__('Pending: %d', 'doublescale'),
											pendingCount
										)}
									</Badge>
								) : null}
							</div>
							<p className="text-sm text-muted-foreground">
								{__(
									'Reps submit sales documents for review. CRM Managers and Sales Managers approve, reject, or send directly.',
									'doublescale'
								)}
							</p>
						</div>
						<Switch
							id="approval-workflow-enabled"
							checked={enabled}
							onCheckedChange={(v) =>
								patch('approval_workflow_enabled', v)
							}
						/>
					</div>

					{enabled && canReview ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								navigate(getToLink('sales/approvals'))
							}
							className="border-primary text-primary bg-white"
						>
							<ListChecks className="h-4 w-4 mr-1" />
							{__('Open Approvals Center', 'doublescale')}
							<ExternalLinkIcon width={24} height={24} className="w-6 h-6 ml-1 opacity-60" />
						</Button>
					) : null}
				</div>
			</section>

			<section className="space-y-4 border rounded-lg bg-[#F7F8FA] p-6">
				<div>
					<h2 className="lg:text-xl text-base font-semibold text-foreground">
						{__('How it works', 'doublescale')}
					</h2>
					<p className="lg:text-base text-sm text-muted-foreground mt-1">
						{__(
							'When the workflow is enabled, sending follows these rules for proposals, invoices, contracts, and credit notes.',
							'doublescale'
						)}
					</p>
				</div>
				<ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
					<li>
						{__(
							'Sales reps see “Submit for Approval” instead of sending directly.',
							'doublescale'
						)}
					</li>
					<li>
						{__(
							'Pricing and line items are locked while a document is pending approval.',
							'doublescale'
						)}
					</li>
					<li>
						{__(
							'Reviewers are notified and can approve or reject with a required reason.',
							'doublescale'
						)}
					</li>
					<li>
						{__(
							'After approval, the rep sends the document manually — nothing is emailed automatically.',
							'doublescale'
						)}
					</li>
					<li>
						{__(
							'Reps can withdraw a pending request to edit again before it is reviewed; managers are notified.',
							'doublescale'
						)}
					</li>
					<li>
						{__(
							'If a manager edits a document while it is pending, the request is reset and the rep is notified to review and re-submit.',
							'doublescale'
						)}
					</li>
					<li>
						{__(
							'Editing an approved document clears approval; the rep must submit again before sending (including accepted proposals, active contracts, partially applied or overdue invoices, and partially applied credit notes).',
							'doublescale'
						)}
					</li>
					<li>
						{__(
							'Converting a proposal to an invoice requires an approved proposal; the new invoice needs its own approval.',
							'doublescale'
						)}
					</li>
					<li>
						{__(
							'Managers may still send directly without submitting for approval.',
							'doublescale'
						)}
					</li>
				</ul>
			</section>
		</div>
	);
};
