/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { ButtonBlockProps } from '..';
import {
	AlignmentControl,
	PaddingControl,
	ColorPickerControl,
	InputWithMergeTags,
	LinkInput,
} from '../../shared';

export interface ButtonEditorProps {
	props: ButtonBlockProps;
	onChange: (updates: Partial<ButtonBlockProps>) => void;
}

export const ButtonEditor = ({ props, onChange }: ButtonEditorProps) => {
	return (
		<div className="grid gap-5">
			{/* Button Text with Merge Tags */}
			<InputWithMergeTags
				label={__('Button Text', 'quillcrm')}
				value={props.text}
				onChange={(text) => onChange({ text })}
				placeholder="Click Here"
				fieldName="text"
			/>

			{/* Link URL */}
			<LinkInput
				label={__('Link URL', 'quillcrm')}
				value={props.url}
				onChange={(url) => onChange({ url })}
				placeholder="https://example.com"
			/>

			{/* Button Style */}
			<div className="flex flex-col gap-2 text-[#333333]">
				<div>{__('Button Style', 'quillcrm')}</div>
				<Select
					value={props.buttonStyle}
					onValueChange={(value) =>
						onChange({
							buttonStyle: value as
								| 'primary'
								| 'secondary'
								| 'tertiary',
						})
					}
				>
					<SelectTrigger className="w-full rounded-lg border-border h-10">
						<SelectValue
							placeholder={__('Select button style', 'quillcrm')}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="primary">
							{__('Primary Button', 'quillcrm')}
						</SelectItem>
						<SelectItem value="secondary">
							{__('Secondary Button', 'quillcrm')}
						</SelectItem>
						<SelectItem value="tertiary">
							{__('Tertiary Button', 'quillcrm')}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Alignment */}
			<AlignmentControl
				value={props.align as 'left' | 'center' | 'right' | 'full'}
				onChange={(align) => onChange({ align })}
				includeFull={true}
			/>

			{/* Container Colors */}
			<ColorPickerControl
				value={props.containerBackgroundColor}
				onChange={(containerBackgroundColor) =>
					onChange({ containerBackgroundColor })
				}
				label={__('Background Color', 'quillcrm')}
				id="container-bg-color"
			/>

			{/* Container Padding */}
			<PaddingControl
				value={
					props.containerPadding || {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					}
				}
				onChange={(containerPadding) => onChange({ containerPadding })}
				label={__('Padding', 'quillcrm')}
			/>
		</div>
	);
};
