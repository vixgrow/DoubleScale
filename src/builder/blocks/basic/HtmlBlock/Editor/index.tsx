/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import { PaddingControl, WidthHeightControl } from '../../shared';
import { HtmlDialog } from './HtmlDialog';
import { HtmlBlockProps } from '..';

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
		<div className="grid gap-5">
			{/* HTML Content Dialog */}
			<div className="flex flex-col gap-2 text-[#333333]">
				<div>{__('HTML Content', 'quillcrm')}</div>
				<HtmlDialog
					content={props.content}
					customCss={props.customCss}
					onSave={handleSaveDialog}
				/>
			</div>

			{/* Width */}
			<WidthHeightControl
				width={props.width}
				onWidthChange={(width) => onChange({ width })}
				widthUnit="%"
				widthPlaceholder="100"
				showHeight={false}
			/>

			{/* Padding */}
			<PaddingControl
				value={
					props.padding || { top: 0, right: 0, bottom: 0, left: 0 }
				}
				onChange={(padding) => onChange({ padding })}
			/>
		</div>
	);
};
