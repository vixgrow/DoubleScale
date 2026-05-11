/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import React, { useState } from 'react';
/**
 * Internal dependencies
 */
import { ColorSelector, CopyWhiteIcon } from '@/components/booking';
import { useCopyToClipboard, useApi } from '@/hooks/booking';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PopupCode: React.FC<{
	url: string;
	icon: React.ReactNode;
	title: string;
}> = ({ url, icon, title }) => {
	const copyToClipboard = useCopyToClipboard();
	const { loading } = useApi();
	const [buttonSettings, setButtonSettings] = useState({
		title: '',
		backgroundColor: '',
		textColor: '',
		borderColor: '',
		borderRadius: 0,
		borderWidth: 0,
		fontSize: 0,
		padding: { top: 0, right: 0, bottom: 0, left: 0 },
		popupMaxWidth: { value: 100, unit: '%' },
		popupMaxHeight: { value: 100, unit: '%' },
	});
	const handleChange = (field, value) => {
		setButtonSettings((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handlePaddingChange = (side, value) => {
		setButtonSettings((prev) => ({
			...prev,
			padding: {
				...prev.padding,
				[side]: value,
			},
		}));
	};

	const handlePopupSizeChange = (field, value, unit) => {
		setButtonSettings((prev) => ({
			...prev,
			[field]: { value, unit },
		}));
	};

	return (
        <>
            {/* static */}
            <div
                className='flex gap-2.5 flex items-center border-b pb-4 mb-4 border-[#E4E4E4]'>
				<div className="rounded-lg p-2 border border-secondary">
					{icon}
				</div>
				<div className="flex flex-col">
					<span className="text-[#09090B] text-[20px] font-[700]">
						{title}
					</span>
					<span className="text-[12px] font-[400] text-[#71717A]">
						{__('Popup Settings', 'doublescale')}
					</span>
				</div>
			</div>
            <div className='flex flex-col gap-2.5 pb-4'>
				<div className="text-[16px]">
					{__('Button title', 'doublescale')}
				</div>
				<Input
					placeholder="Preview"
					className="h-[48px] rounded-lg"
					value={buttonSettings.title}
					onChange={(e) => handleChange('title', e.target.value)}
				/>
			</div>
            <div className='flex gap-[25px] justify-start items-center'>
				<div className='flex flex-col gap-2 items-baseline justify-center'>
					<div className="text-[15px]">
						{__('Button background color', 'doublescale')}
					</div>
					<div className="grid grid-cols-3 gap-4 place-items-center mt-2">
						<ColorSelector
							selectedColor={
								buttonSettings.backgroundColor || null
							}
							onColorSelect={(color) =>
								handleChange('backgroundColor', color)
							}
						/>
					</div>
				</div>
				<div className='flex flex-col gap-2'>
					<div className="text-[15px]">
						{__('Button text color', 'doublescale')}
					</div>
					<div className="grid grid-cols-3 gap-4 place-items-center mt-2">
						<ColorSelector
							selectedColor={buttonSettings.textColor || null}
							onColorSelect={(color) =>
								handleChange('textColor', color)
							}
						/>
					</div>
				</div>
				<div className='flex flex-col gap-2'>
					<div className="text-[15px]">
						{__('Button border color', 'doublescale')}
					</div>
					<div className="grid grid-cols-3 gap-4 place-items-center mt-2">
						<ColorSelector
							selectedColor={buttonSettings.borderColor || null}
							onColorSelect={(color) =>
								handleChange('borderColor', color)
							}
						/>
					</div>
				</div>
			</div>
            <div className='flex gap-2.5 mt-4'>
				<div className='flex flex-col gap-2.5'>
					<div className="text-[14px] font-semibold">
						{__('Button border radius(px)', 'doublescale')}
					</div>
					<Input
						placeholder="0"
						className="h-[48px] rounded-lg"
						value={buttonSettings.borderRadius}
						onChange={(e) =>
							handleChange('borderRadius', e.target.value)
						}
						type="number"
					/>
				</div>
				<div className='flex flex-col gap-2.5'>
					<div className="text-[14px] font-semibold">
						{__('Button border width(px)', 'doublescale')}
					</div>
					<Input
						placeholder="0"
						className="h-[48px] rounded-lg"
						value={buttonSettings.borderWidth}
						onChange={(e) =>
							handleChange('borderWidth', e.target.value)
						}
						type="number"
					/>
				</div>
				<div className='flex flex-col gap-2.5'>
					<div className="text-[14px] font-semibold">
						{__('Button font size(px)', 'doublescale')}
					</div>
					<Input
						placeholder="0"
						className="h-[48px] rounded-lg"
						value={buttonSettings.fontSize}
						onChange={(e) =>
							handleChange('fontSize', e.target.value)
						}
						type="number"
					/>
				</div>
			</div>
            <div className='flex flex-col gap-2.5 mt-4'>
				<div className="text-[14px] font-semibold">
					{__('Button padding(px)', 'doublescale')}
				</div>
				<div className="grid grid-cols-4 gap-2">
					{(['top', 'right', 'bottom', 'left'] as const).map((side) => (
						<div
							key={side}
							className="flex items-center h-[48px] rounded-lg border border-input bg-background pl-2 focus-within:ring-2 focus-within:ring-ring"
						>
							<span className="text-[#A1A1A1] mr-2 capitalize">
								{side}
							</span>
							<Input
								placeholder="0"
								className="h-full border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
								defaultValue={0}
								value={buttonSettings.padding[side]}
								onChange={(e) =>
									handlePaddingChange(side, e.target.value)
								}
								type="number"
							/>
						</div>
					))}
				</div>
			</div>
            <div className='flex gap-2.5 mt-4'>
				<div className='flex flex-col gap-2.5'>
					<div className="text-[15px] font-semibold">
						{__('Popup max width', 'doublescale')}
					</div>
					<div className='flex gap-2.5'>
						<Input
							className="h-[48px] rounded-lg w-[132px]"
							placeholder="100"
							value={buttonSettings.popupMaxWidth.value}
							onChange={(e) =>
								handlePopupSizeChange(
									'popupMaxWidth',
									e.target.value,
									buttonSettings.popupMaxWidth.unit
								)
							}
							type="number"
						/>
						<Select
                            defaultValue={buttonSettings.popupMaxWidth.unit}
                            onValueChange={(unit) =>
								handlePopupSizeChange(
									'popupMaxWidth',
									buttonSettings.popupMaxWidth.value,
									unit
								)
							} />
					</div>
				</div>
				<div className='flex flex-col gap-2.5'>
					<div className="text-[15px] font-semibold">
						{__('Popup max height', 'doublescale')}
					</div>
					<div className='flex gap-2.5'>
						<Input
							className="h-[48px] rounded-lg w-[132px]"
							placeholder="100"
							value={buttonSettings.popupMaxHeight.value}
							onChange={(e) =>
								handlePopupSizeChange(
									'popupMaxHeight',
									e.target.value,
									buttonSettings.popupMaxHeight.unit
								)
							}
							type="number"
						/>
						<Select
                            defaultValue={buttonSettings.popupMaxHeight.unit}
                            onValueChange={(unit) =>
								handlePopupSizeChange(
									'popupMaxHeight',
									buttonSettings.popupMaxHeight.value,
									unit
								)
							} />
					</div>
				</div>
			</div>
            <div className='flex flex-col pt-4'>
				<div className="pb-2 text-[#3F4254] text-[16px] font-semibold">
					{__(
						'Copy the shortcode below and insert it in your WordPress page or post.',
						'doublescale'
					)}
				</div>
				<div className='flex gap-2.5 flex-col'>
					<Input
						value={url}
						readOnly
						className="h-[140px] text-[#999999] rounded-lg"
					/>
					<Button
						className="bg-primary h-[48px] px-9 w-fit rounded-lg text-white"
						onClick={() =>
							copyToClipboard(
								url,
								__('Link copied', 'doublescale')
							)
						}
						disabled
					>
						<CopyWhiteIcon />
						<span className="text-white text-[16px] font-[500] self-center">
							{__('Copy', 'doublescale')}
						</span>
					</Button>
				</div>
			</div>
        </>
    );
};

export default PopupCode;
