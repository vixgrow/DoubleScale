/**
 * Product Block Editor - REFACTORED
 *
 * Improvements:
 * - Uses BaseBlockEditor wrapper
 * - Uses grouped control imports
 * - Better organization and type safety
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductBlockProps } from '..';
import { ProductSelectionDialog } from './ProductSelectionDialog';
import {
	BaseBlockEditor,
	BlockEditorErrorBoundary,
} from '../../shared/BaseBlockEditor';
import * as LayoutControls from '../../shared/control-groups/layout';
import * as StyleControls from '../../shared/control-groups/style';
import * as MediaControls from '../../shared/control-groups/media';

export interface ProductBlockEditorProps {
	props: ProductBlockProps;
	onChange: (updates: Partial<ProductBlockProps>) => void;
}

export const ProductBlockEditor: React.FC<ProductBlockEditorProps> = ({
	props,
	onChange,
}) => {
	return (
		<BlockEditorErrorBoundary>
			<BaseBlockEditor props={props} onChange={onChange}>
				{(props, onChange) => (
					<>
						{/* Product Block Width */}
						<div className="flex flex-col gap-2 text-[#333333]">
							<LayoutControls.WidthHeightControl
								width={props.width}
								onWidthChange={(width) => onChange({ width })}
								widthLabel={__('Block Width', 'quillcrm')}
								showHeight={false}
								widthOptions={[
									{ value: '100%', label: '100%' },
									{ value: '75%', label: '75%' },
									{ value: '50%', label: '50%' },
									{ value: '25%', label: '25%' },
								]}
							/>
						</div>

						{/* Padding */}
						<LayoutControls.PaddingControl
							value={
								props.padding || {
									top: 16,
									right: 16,
									bottom: 16,
									left: 16,
								}
							}
							onChange={(padding) => onChange({ padding })}
							label={__('Block Padding', 'quillcrm')}
						/>

						{/* WooCommerce Product Selection */}
						<div className="space-y-2">
							<ProductSelectionDialog
								props={props}
								onChange={onChange}
							>
								<Button
									variant="outline"
									className="w-full justify-center"
									disabled={false}
								>
									{__(
										'Select from WooCommerce Products',
										'quillcrm'
									)}
								</Button>
							</ProductSelectionDialog>
							{props.productId && (
								<p className="text-xs text-gray-500">
									{__('WooCommerce Product ID:', 'quillcrm')}{' '}
									<span className="font-mono font-semibold">
										#{props.productId}
									</span>
								</p>
							)}
						</div>

						{/* Image Upload */}
						<MediaControls.ImageUploadControl
							label={__('Product Image', 'quillcrm')}
							value={props.imageSrc}
							onChange={({ src, alt }) =>
								onChange({ imageSrc: src, imageAlt: alt })
							}
							alt={props.imageAlt}
							uploadId="product-image"
						/>

						{/* Alt Text Input */}
						<MediaControls.AltTextInput
							value={props.imageAlt}
							onChange={(imageAlt) => onChange({ imageAlt })}
							placeholder={__(
								'Describe the product image',
								'quillcrm'
							)}
						/>

						{/* Title Input */}
						<MediaControls.InputWithMergeTags
							label={__('Product Title', 'quillcrm')}
							value={props.title}
							onChange={(title) => onChange({ title })}
							placeholder="Product Title"
							fieldName="title"
						/>

						{/* Description Textarea */}
						<div className="flex flex-col gap-2 text-[#333333]">
							<label htmlFor="description" className="text-sm">
								{__('Product Description', 'quillcrm')}
							</label>
							<textarea
								id="description"
								value={props.description}
								onChange={(e) =>
									onChange({ description: e.target.value })
								}
								placeholder="Product description goes here"
								className="w-full rounded-lg border border-border p-3 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						{/* Price Input */}
						<div className="flex flex-col gap-1 text-[#333333]">
							<label className="text-sm">
								{__('Product Price', 'quillcrm')}
							</label>
							<div className="relative flex items-center">
								<Input
									id="price"
									type="text"
									value={props.price}
									onChange={(e) =>
										onChange({ price: e.target.value })
									}
									placeholder="99.99"
									className="pr-8 h-10"
									style={{
										borderColor: '#e5e5e5',
										borderRadius: '0.5rem',
									}}
								/>
							</div>
						</div>

						{/* Button Text */}
						<MediaControls.InputWithMergeTags
							label={__('Button Text', 'quillcrm')}
							value={props.buttonText}
							onChange={(buttonText) => onChange({ buttonText })}
							placeholder="Learn More"
							fieldName="buttonText"
						/>

						{/* Button Link */}
						<MediaControls.LinkInput
							label={__('Button Link', 'quillcrm')}
							value={props.buttonLink}
							onChange={(buttonLink) => onChange({ buttonLink })}
							placeholder="https://example.com"
						/>

						{/* Button Style */}
						<div className="flex flex-col gap-2 text-[#333333]">
							<label className="text-sm">
								{__('Button Style', 'quillcrm')}
							</label>
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
										placeholder={__(
											'Select button style',
											'quillcrm'
										)}
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

						{/* Image Padding */}
						<LayoutControls.PaddingControl
							value={
								props.imagePadding || {
									top: 8,
									right: 8,
									bottom: 8,
									left: 8,
								}
							}
							onChange={(imagePadding) =>
								onChange({ imagePadding })
							}
							label={__('Image Padding', 'quillcrm')}
						/>

						{/* Border Color */}
						<StyleControls.ColorPickerControl
							value={props.borderColor}
							onChange={(borderColor) =>
								onChange({ borderColor })
							}
							label={__('Border Color', 'quillcrm')}
							id="border-color"
						/>

						{/* Title Color */}
						<StyleControls.ColorPickerControl
							value={props.titleColor}
							onChange={(titleColor) => onChange({ titleColor })}
							label={__('Title Color', 'quillcrm')}
							id="title-color"
						/>

						{/* Description Color */}
						<StyleControls.ColorPickerControl
							value={props.descriptionColor}
							onChange={(descriptionColor) =>
								onChange({ descriptionColor })
							}
							label={__('Description Color', 'quillcrm')}
							id="description-color"
						/>

						{/* Price Color */}
						<StyleControls.ColorPickerControl
							value={props.priceColor}
							onChange={(priceColor) => onChange({ priceColor })}
							label={__('Price Color', 'quillcrm')}
							id="price-color"
						/>

						{/* Image Background Color */}
						<StyleControls.ColorPickerControl
							value={props.imageBackgroundColor}
							onChange={(imageBackgroundColor) =>
								onChange({ imageBackgroundColor })
							}
							label={__('Image Background Color', 'quillcrm')}
							id="image-bg-color"
						/>
					</>
				)}
			</BaseBlockEditor>
		</BlockEditorErrorBoundary>
	);
};
