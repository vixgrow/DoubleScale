/**
 * Step breadcrumb for document create/edit flow (Propovoice-style).
 */

import React, { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ChevronRight } from 'lucide-react';

export type DocumentEditorStep = 'template' | 'content' | 'preview';

interface DocumentEditorStepsProps {
	activeStep: DocumentEditorStep;
	className?: string;
}

const STEPS: { id: DocumentEditorStep; label: string }[] = [
	{ id: 'template', label: __('Select Template', 'doublescale') },
	{ id: 'content', label: __('Add Content', 'doublescale') },
	{ id: 'preview', label: __('Preview & Share', 'doublescale') },
];

export const DocumentEditorSteps: React.FC<DocumentEditorStepsProps> = ({
	activeStep,
	className = '',
}) => (
	<nav
		className={`flex flex-wrap items-center gap-2 text-sm ${className}`}
		aria-label={__('Document progress', 'doublescale')}
	>
		{STEPS.map((step, index) => (
			<Fragment key={step.id}>
				{index > 0 ? (
					<ChevronRight
						className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
						aria-hidden
					/>
				) : null}
				<span
					className={
						activeStep === step.id
							? 'font-semibold text-[#0D9DFC]'
							: 'font-medium text-muted-foreground'
					}
				>
					{step.label}
				</span>
			</Fragment>
		))}
	</nav>
);
