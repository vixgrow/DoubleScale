/**
 * Rich-text field for sales email intro templates.
 */

import React from 'react';
import { __ } from '@wordpress/i18n';

import { Editor } from '@doublescale/components';
import type { SalesEmailDocumentType } from '@/components/merge-tags/utils';

interface SalesEmailIntroFieldProps {
	value: string;
	onChange: (value: string) => void;
	/** Limits merge tags to fields available for this document type. */
	documentType: SalesEmailDocumentType;
}

export const SalesEmailIntroField: React.FC<SalesEmailIntroFieldProps> = ({
	value,
	onChange,
	documentType,
}) => (
	<div className="min-w-0 max-w-full overflow-hidden rounded-lg max-sm:[&_.email-body-editor]:max-w-full max-sm:[&_.email-body-editor_.editor-container]:max-w-full max-sm:[&_.toolbar]:flex-col max-sm:[&_.toolbar]:gap-2 max-sm:[&_.toolbar]:p-3 max-sm:[&_.toolbar>div]:w-full max-sm:[&_.toolbar>div]:flex-wrap max-sm:[&_.toolbar>div]:justify-center max-sm:[&_.editor-inner]:min-w-0 max-sm:[&_.editor-inner]:overflow-x-hidden max-sm:[&_.editor-input]:break-words max-sm:[&_.editor-input_img]:h-auto max-sm:[&_.editor-input_img]:max-w-full">
		<Editor
			message={value}
			onChange={onChange}
			placeholder={__('Write the email introduction…', 'doublescale')}
			salesEmailDocumentType={documentType}
		/>
	</div>
);
