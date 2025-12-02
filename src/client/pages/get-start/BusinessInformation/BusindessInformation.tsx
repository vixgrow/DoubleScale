import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone } from 'react-dropzone';
import { useState, useEffect, useMemo } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import type { Settings } from '@quillcrm/client';

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@quillcrm/components/ui/form';
import { Input } from '@quillcrm/components/ui/input';
import { Textarea } from '@quillcrm/components/ui/textarea';
import ButtonComponent from '../component/button';
import UploadImageIcon from '@quillcrm/components/icons/upload-image';

export const formSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters').optional(),
	address: z.string().min(1, 'Business address is required').optional(),
	image: z
		.instanceof(File, { message: 'Please upload a valid image' })
		.optional()
		.nullable(),
});

export type FormType = z.infer<typeof formSchema>;

type LogoUploadProps = {
	value: File | null;
	onChange: (file: File | null) => void;
	existingLogoUrl: string;
	error?: string;
};

function LogoUpload({
	value,
	onChange,
	existingLogoUrl,
	error,
}: Readonly<LogoUploadProps>) {
	const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

	const displayImage = useMemo(() => {
		if (localPreviewUrl) return localPreviewUrl;
		if (value) return URL.createObjectURL(value);
		return existingLogoUrl || null;
	}, [localPreviewUrl, value, existingLogoUrl]);

	const onDrop = (acceptedFiles: File[]) => {
		const file = acceptedFiles[0];
		if (!file) return;

		onChange(file);

		const previewUrl = URL.createObjectURL(file);
		setLocalPreviewUrl(previewUrl);
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { 'image/*': [] },
		multiple: false,
	});

	return (
		<div className="space-y-2">
			<div
				{...getRootProps()}
				className={`
					relative border-2 border-dashed rounded-2xl 
					flex flex-col items-center justify-center py-12 cursor-pointer 
					transition-all text-center
					${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
					${error ? 'border-red-500' : ''}
				`}
			>
				<input {...getInputProps()} />

				{displayImage ? (
					<div className="space-y-4">
						<img
							src={displayImage}
							alt="Logo preview"
							className="w-32 h-32 object-contain rounded-lg border"
						/>
						<p className="text-sm text-gray-600">
							{__('Click or drag to replace', 'quillcrm')}
						</p>
					</div>
				) : (
					<>
						<UploadImageIcon />
						<p className="text-xl leading-[30px] font-medium text-[#458DC7]">
							{__('Browse images', 'quillcrm')}
							<span className="text-[#09090B]">
								{' '}
								{__('to upload', 'quillcrm')}
							</span>
						</p>
						<p className="text-base leading-[26px] text-[#979797] mt-1">
							{__('or drag and drop it here', 'quillcrm')}
						</p>
					</>
				)}
			</div>
			{error ? <p className="text-sm text-red-500">{error}</p> : null}
		</div>
	);
}

export default function BusindessInformation({
	onNext,
	onPrevious,
}: Readonly<{
	onNext: () => void;
	onPrevious: () => void;
}>) {
	const [isLoading, setIsLoading] = useState(true);
	const [existingLogoUrl, setExistingLogoUrl] = useState<string>('');
	const { createNotice } = useDispatch('quillcrm/core');

	const form = useForm<FormType>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			address: '',
			image: null,
		},
	});

	/**
	 * Fetch existing business settings
	 */
	useEffect(() => {
		let isMounted = true;

		void (async () => {
			setIsLoading(true);
			try {
				const response = await apiFetch({ path: '/qc/v1/settings' });

				if (!isMounted) return;

				const settings = response as Settings;
				const businessSettings = settings?.business || {};

				if (businessSettings.business_name) {
					form.setValue('name', businessSettings.business_name);
				}
				if (businessSettings.business_address) {
					form.setValue('address', businessSettings.business_address);
				}
				if (businessSettings.business_logo) {
					setExistingLogoUrl(businessSettings.business_logo);
				}
			} catch (error: any) {
				if (!isMounted) return;

				console.error('Failed to fetch settings:', error);
				const errorMessage =
					error?.message ||
					error?.data?.message ||
					__('Failed to fetch business information', 'quillcrm');
				createNotice({
					type: 'error',
					message: errorMessage,
				});
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		})();

		return () => {
			isMounted = false;
		};
	}, [form, createNotice]);

	/**
	 * Upload image to WordPress media library
	 */
	const uploadImageToMediaLibrary = async (
		file: File
	): Promise<string | null> => {
		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await apiFetch({
				path: '/wp/v2/media',
				method: 'POST',
				body: formData,
			});

			// WordPress media API returns the attachment object with source_url
			const attachment = response as {
				id: number;
				source_url: string;
				url: string;
			};

			// Return the URL of the uploaded image
			return attachment.source_url || attachment.url || null;
		} catch (error: any) {
			console.error('Error uploading image:', error);
			const errorMessage =
				error?.message ||
				error?.data?.message ||
				__('Failed to upload image', 'quillcrm');
			createNotice({
				type: 'error',
				message: errorMessage,
			});
			return null;
		}
	};

	/**
	 * Save business information to settings
	 */
	const saveBusinessInformation = async (data: FormType) => {
		try {
			let logoUrl = existingLogoUrl; // Keep existing logo by default

			// Upload image first if present (new file uploaded)
			if (data.image) {
				const uploadedUrl = await uploadImageToMediaLibrary(data.image);
				if (uploadedUrl) {
					logoUrl = uploadedUrl;
				} else {
					// If image upload fails, stop the process
					return;
				}
			}

			// Prepare settings payload
			const settings = {
				business: {
					business_name: data.name || '',
					business_address: data.address || '',
					business_logo: logoUrl,
				},
			};

			// Save settings
			await apiFetch({
				path: '/qc/v1/settings',
				method: 'POST',
				data: settings,
			});

			// Show success message
			createNotice({
				type: 'success',
				message: __(
					'Business information saved successfully',
					'quillcrm'
				),
			});

			// Proceed to next step
			onNext();
		} catch (error: any) {
			console.error('Error saving business information:', error);
			const errorMessage =
				error?.message ||
				error?.data?.message ||
				__('Failed to save business information', 'quillcrm');
			createNotice({
				type: 'error',
				message: errorMessage,
			});
		}
	};

	const handleNext = form.handleSubmit(async (data) => {
		await saveBusinessInformation(data);
		onNext();
	});

	const handlePrevious = form.handleSubmit(async (data) => {
		await saveBusinessInformation(data);
		onPrevious();
	});

	const isSubmitting = form.formState.isSubmitting;

	if (isLoading) {
		return (
			<div className="flex flex-col gap-10">
				<div className="text-center py-12">
					<p className="text-[#777] text-lg">
						{__('Loading business information...', 'quillcrm')}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-10">
			{/* Header */}
			<div>
				<h3 className="text-[#170F49] text-[32px] font-semibold">
					{__('Please provide your business information', 'quillcrm')}
				</h3>
				<p className="text-[#777] text-lg font-normal leading-7">
					{__(
						"This will be used for your email campaign, Subscriber's front pages",
						'quillcrm'
					)}
				</p>
			</div>

			<Form {...form}>
				<form onSubmit={handleNext} className="space-y-6">
					{/* Business Name */}
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-base text-[#09090B] leading-[150%]">
									{__('Business Name', 'quillcrm')}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={__(
											'Enter your business name',
											'quillcrm'
										)}
										{...field}
										className="border border-[#DEE1E6] rounded-[8px] h-12 py-[5px] px-4"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Grid: Address + Logo */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Address */}
						<FormField
							control={form.control}
							name="address"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-base text-[#09090B] leading-[150%]">
										{__('Business Address', 'quillcrm')}
									</FormLabel>
									<FormControl>
										<Textarea
											placeholder={__(
												'Type here business address....',
												'quillcrm'
											)}
											{...field}
											className="border border-[#DEE1E6] rounded-[8px]  py-3 px-4 min-h-[190px] resize-none"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Logo Upload  */}
						<FormField
							control={form.control}
							name="image"
							render={({ field }) => {
								return (
									<FormItem>
										<FormLabel className="text-base text-[#09090B] leading-[150%]">
											{__('Logo', 'quillcrm')}
										</FormLabel>
										<FormControl>
											<LogoUpload
												value={field.value || null}
												onChange={(file) => {
													field.onChange(file);
													if (file) {
														setExistingLogoUrl('');
													}
												}}
												existingLogoUrl={
													existingLogoUrl
												}
												error={
													form.formState.errors.image
														?.message
												}
											/>
										</FormControl>
										{/* Error is rendered inside LogoUpload */}
									</FormItem>
								);
							}}
						/>
					</div>

					{/* Buttons */}
					<div className="flex justify-between pt-8">
						<ButtonComponent
							onClick={handlePrevious}
							type=""
							disabled={isSubmitting}
						>
							{__('Previous', 'quillcrm')}
						</ButtonComponent>
						<ButtonComponent
							type="go"
							onClick={handleNext}
							disabled={isSubmitting}
						>
							{isSubmitting
								? __('Saving...', 'quillcrm')
								: __('Next Step', 'quillcrm')}
						</ButtonComponent>
					</div>
				</form>
			</Form>
		</div>
	);
}
