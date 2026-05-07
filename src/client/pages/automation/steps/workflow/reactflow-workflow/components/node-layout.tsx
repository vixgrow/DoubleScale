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
import NodeActionsDropdown from './node-actions-dropdown';

interface NodeLayoutProps {
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
	const hasFooter = (viewMode && analytics) || customFooter;

	return (
		<>
			<div
				className={
					hasFooter ? 'doublescale-reactflow-node__header-row border-b' : ''
				}
			>
				<div className="doublescale-reactflow-node__header-left">
					<div className="doublescale-reactflow-node__icon">{icon}</div>
					<div className="doublescale-reactflow-node__content">
						<div className="doublescale-reactflow-node__title">
							{title}
						</div>
						<div className="doublescale-reactflow-node__subtitle">
							{subtitle}
						</div>
					</div>
				</div>
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
			</div>

			{/* Footer: Analytics or Custom */}
			{viewMode && analytics && (
				<div className="doublescale-reactflow-node__footer-row">
					<div className="text-sm">
						<span className="text-[#667085]">
							{__('Contact:', 'doublescale')}{' '}
						</span>
						<span className="font-semibold text-[#344054]">
							{analytics.contacts || 0}
						</span>
					</div>
					<div className="text-sm">
						<span className="text-[#667085]">
							{__('Conversion Rate:', 'doublescale')}{' '}
						</span>
						<span className="font-semibold text-[#344054]">
							{analytics.conversion_rate || 0}%
						</span>
					</div>
				</div>
			)}
			{customFooter}
		</>
	);
};

export default NodeLayout;
