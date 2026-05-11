import React, { useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { map, get } from 'lodash';
import type { LocationField } from '@/config/booking';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LocationModalProps {
	isVisible: boolean;
	newLocationType: string | null;
	locationTypes: any;
	onOk: () => Promise<void>;
	onCancel: () => void;
	form: any;
}

const LocationModal: React.FC<LocationModalProps> = ({
	isVisible,
	newLocationType,
	locationTypes,
	onOk,
	onCancel,
	form,
}) => {
	const renderCustomLocationFields = () => (
		<div className="space-y-4">
			<div>
				<div className="text-[#09090B] text-[16px] mb-1">
					{__('Location Name', 'doublescale')}
					<span className="text-red-500">*</span>
				</div>
				<Input
					placeholder={__('Location Name', 'doublescale')}
					className="rounded-lg h-[48px]"
					value={form.getFieldValue?.('location') || ''}
					onChange={(e) => form.setFieldsValue({ location: e.target.value })}
					required
				/>
			</div>

			<div>
				<div className="text-[#09090B] text-[16px] mb-1">
					{__('Description', 'doublescale')}
					<span className="text-red-500">*</span>
				</div>
				<Textarea
					rows={4}
					placeholder={__('Description', 'doublescale')}
					className="rounded-lg"
					value={form.getFieldValue?.('description') || ''}
					onChange={(e) => form.setFieldsValue({ description: e.target.value })}
					required
				/>
			</div>

			<div className="flex items-center gap-2">
				<Checkbox
					className="custom-check"
					checked={form.getFieldValue?.('display_on_booking') || false}
					onCheckedChange={(checked) => form.setFieldsValue({ display_on_booking: checked })}
				/>
				<span className="text-[#3F4254] font-semibold">
					{__('Display on booking', 'doublescale')}
				</span>
			</div>
		</div>
	);

	const renderStandardLocationFields = () => {
		if (!newLocationType) return null;

		return (
			<div className="space-y-4">
				{map(
					get(locationTypes, `${newLocationType}.fields`, {}),
					(field: LocationField, fieldKey) => (
						<div key={fieldKey}>
							{field.type === 'checkbox' ? (
								<div className="flex items-center gap-2">
									<Checkbox
										className="custom-check"
										checked={form.getFieldValue?.(fieldKey) || false}
										onCheckedChange={(checked) => form.setFieldsValue({ [fieldKey]: checked })}
									/>
									<span className="text-[#3F4254] font-semibold">{field.label}</span>
								</div>
							) : (
								<>
									<div className="text-[#09090B] text-[16px] mb-1">
										{field.label}
										<span className="text-red-500">*</span>
										{field.label === 'Person Phone' && (
											<span className="text-[#afb9c4] text-sm ml-2">
												(with country code)
											</span>
										)}
									</div>
									<Input
										type={field.type}
										placeholder={sprintf(__('%s', 'doublescale'), field.label)}
										className="rounded-lg h-[48px]"
										value={form.getFieldValue?.(fieldKey) || ''}
										onChange={(e) => form.setFieldsValue({ [fieldKey]: e.target.value })}
										required={field.required}
									/>
								</>
							)}
						</div>
					)
				)}
			</div>
		);
	};

	const getModalTitle = () => {
		if (newLocationType === 'custom') {
			return __('Custom Location', 'doublescale');
		}
		return sprintf(
			__(' %s ', 'doublescale'),
			get(locationTypes, `${newLocationType}.title`, '')
		);
	};

	return (
		<Dialog
			open={isVisible}
			onOpenChange={(open) => {
				if (!open) onCancel();
			}}
		>
			<DialogContent className="z-[150300]">
				<DialogHeader>
					<DialogTitle>
						<div>
							<h2 className="text-[#09090B] text-[30px] font-[700]">
								{getModalTitle()}
							</h2>
							<span className="text-[#979797] font-[400] text-[14px]">
								Add the following data.
							</span>
						</div>
					</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						onOk();
					}}
					className="space-y-4"
				>
					{newLocationType === 'custom'
						? renderCustomLocationFields()
						: renderStandardLocationFields()}

					<Button
						type="submit"
						className="w-full bg-primary text-white font-semibold rounded-lg transition-all"
					>
						{__('Submit', 'doublescale')}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default LocationModal;
