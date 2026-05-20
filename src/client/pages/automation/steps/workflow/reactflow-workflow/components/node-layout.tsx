/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { cn } from '@/lib/utils';
import NodeActionsDropdown from './node-actions-dropdown';
import { ContactsIcon, ConversionRateIcon } from '@doublescale/components';

export type NodeLayoutVariant =
	| 'trigger'
	| 'action'
	| 'goal'
	| 'delay'
	| 'condition'
	| 'end_automation';


interface NodeLayoutProps {
	variant: NodeLayoutVariant;
	icon: React.ReactNode;
	title: string;
	subtitle: React.ReactNode;
	onEdit: () => void;
	onDelete: () => void;
	onChangeTrigger?: () => void;
	editLabel: string;
	deleteLabel: string;
	changeTriggerLabel?: string;
	deleteTitle: string;
	deleteDescription: string;
	showDelete?: boolean;
	showChangeTrigger?: boolean;
	viewMode?: boolean;
	analytics?: { contacts: number; conversion_rate: number };
	customFooter?: React.ReactNode;
}

const NodeLayout: React.FC<NodeLayoutProps> = ({
	variant,
	icon,
	title,
	subtitle,
	onEdit,
	onDelete,
	onChangeTrigger,
	editLabel,
	deleteLabel,
	changeTriggerLabel,
	deleteTitle,
	deleteDescription,
	showDelete = true,
	showChangeTrigger = false,
	viewMode = false,
	analytics,
	customFooter,
}) => {
	const hasAnalyticsFooter = viewMode && analytics;

	return (
		<div className="doublescale-reactflow-node__card-inner">
			<div
				className={cn(
					'doublescale-reactflow-node__header-row',
					`doublescale-reactflow-node__header-row--${variant}`,
					viewMode && 'doublescale-reactflow-node__header-row--reports'
				)}
			>
				<div className="doublescale-reactflow-node__header-left">
					<div className="doublescale-reactflow-node__icon">{icon}</div>
					<div className="doublescale-reactflow-node__content">
						<div className="doublescale-reactflow-node__title">
							{title}
						</div>
					</div>
				</div>
				{!viewMode && (
					<NodeActionsDropdown
						onEdit={onEdit}
						onDelete={onDelete}
						onChangeTrigger={onChangeTrigger}
						editLabel={editLabel}
						deleteLabel={deleteLabel}
						changeTriggerLabel={changeTriggerLabel}
						deleteTitle={deleteTitle}
						deleteDescription={deleteDescription}
						showDelete={showDelete}
						showChangeTrigger={showChangeTrigger}
					/>
				)}
			</div>

			<div className="doublescale-reactflow-node__body-row">
				<div className="doublescale-reactflow-node__subtitle">
					{subtitle}
				</div>
			</div>

			{hasAnalyticsFooter && (
				
				<div className="doublescale-reactflow-node__footer-row">

					<div className="text-sm leading-6 flex items-center gap-1 text-muted-foreground">
						<ContactsIcon width={24} height={24} />
						<span>{__('Contacts:', 'doublescale')} </span>
						<span className="text-foreground">
							{analytics.contacts || 0}
						</span>
					</div>
					<div className="text-sm leading-6 flex items-center gap-1 text-muted-foreground">
						<ConversionRateIcon width={24} height={24} />
						<span>{__('Conversion Rate:', 'doublescale')} </span>
						<span className="text-foreground">
							{analytics.conversion_rate || 0}%
						</span>
					</div>
				</div>
				
			)}
			{customFooter}
		</div>
	);
};

export default NodeLayout;
