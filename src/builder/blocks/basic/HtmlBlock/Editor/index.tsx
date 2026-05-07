/**
 * HTML Block Editor - REFACTORED
 *
 * Improvements:
 * - Uses BaseBlockEditor wrapper
 * - Uses grouped control imports
 * - Better organization
 */

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
import { HtmlBlockProps } from '..';
import { HtmlDialog } from './HtmlDialog';
import {
	BaseBlockEditor,
	BlockEditorErrorBoundary,
} from '../../shared/BaseBlockEditor';
import * as LayoutControls from '../../shared/control-groups/layout';

export interface HtmlBlockEditorProps {
	props: HtmlBlockProps;
	onChange: (updates: Partial<HtmlBlockProps>) => void;
}

export const HtmlBlockEditor: React.FC<HtmlBlockEditorProps> = ({
	props,
	onChange,
}) => {
	const handleSaveDialog = (content: string, customCss: string) => {
		onChange({ content, customCss });
	};

	return (
		<BlockEditorErrorBoundary>
			<BaseBlockEditor props={props} onChange={onChange}>
				{(props, onChange) => (
					<>
						{/* HTML Content Dialog */}
						<div className="flex flex-col gap-2 text-[#333333]">
							<div>{__('HTML Content', 'doublescale')}</div>
							<HtmlDialog
								content={props.content}
								customCss={props.customCss}
								onSave={handleSaveDialog}
							/>
						</div>

						{/* Width */}
						<LayoutControls.WidthHeightControl
							width={props.width}
							onWidthChange={(width) => onChange({ width })}
							widthUnit="%"
							widthPlaceholder="100"
							showHeight={false}
						/>

						{/* Padding */}
						<LayoutControls.PaddingControl
							value={
								props.padding || {
									top: 0,
									right: 0,
									bottom: 0,
									left: 0,
								}
							}
							onChange={(padding) => onChange({ padding })}
						/>
					</>
				)}
			</BaseBlockEditor>
		</BlockEditorErrorBoundary>
	);
};
