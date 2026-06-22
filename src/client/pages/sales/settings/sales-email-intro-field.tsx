/**
 * Rich-text field for sales email intro templates.
 */

import React from 'react';
import { __ } from '@wordpress/i18n';

import { RichTextEditor } from '@/components/rich-text-editor';
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
	<RichTextEditor
		content={value}
		onChange={onChange}
		salesEmailDocumentType={documentType}
		placeholder={__('Write the email introduction…', 'doublescale')}
	/>
);
