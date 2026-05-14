/**
 * HTML Block Editor — inline HTML / CSS (Figma-style), no dialog.
 */

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { HtmlBlockProps } from '..';
import { HtmlCodeSections } from './HtmlCodeSections';
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
	return (
		<BlockEditorErrorBoundary>
			<BaseBlockEditor props={props} onChange={onChange}>
				{(props, onChange) => (
					<>
						<HtmlCodeSections
							content={props.content}
							customCss={props.customCss}
							onContentChange={(content) => onChange({ content })}
							onCustomCssChange={(customCss) => onChange({ customCss })}
						/>

						<LayoutControls.WidthHeightControl
							width={props.width}
							onWidthChange={(width) => onChange({ width })}
							widthUnit="%"
							widthPlaceholder="100"
							showHeight={false}
						/>

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
