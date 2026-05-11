import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone } from 'react-dropzone';
import { useState, useEffect, useMemo } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import type { Settings } from '@doublescale/client';

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@doublescale/components/ui/form';
import { Input } from '@doublescale/components/ui/input';
import { Textarea } from '@doublescale/components/ui/textarea';
import ButtonComponent from '../component/button';
import UploadImageIcon from '@doublescale/shared/icons/upload-image';
import { BusinessFormSkeleton } from './BusinessFormSkeleton';

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
				${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}
				${error ? '!border-destructive' : ''}
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
						<p className="text-sm text-muted-foreground">
							{__('Click or drag to replace', 'doublescale')}
						</p>
					</div>
				) : (
					<>
						<UploadImageIcon />
					<p className="text-sm font-medium text-primary mt-3">
						{__('Browse images', 'doublescale')}
						<span className="text-foreground font-normal">
							{' '}{__('to upload', 'doublescale')}
						</span>
					</p>
					<p className="text-xs text-muted-foreground mt-1">
						{__('or drag and drop it here', 'doublescale')}
					</p>
					</>
				)}
			</div>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
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
	const { createNotice } = useDispatch('doublescale/core');

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
				const response = await apiFetch({ path: '/doublescale/v1/settings' });

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
					__('Failed to fetch business information', 'doublescale');
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
				__('Failed to upload image', 'doublescale');
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
				path: '/doublescale/v1/settings',
				method: 'POST',
				data: settings,
			});

			// Show success message
			createNotice({
				type: 'success',
				message: __(
					'Business information saved successfully',
					'doublescale'
				),
			});

			// Proceed to next step
			onNext();
		} catch (error: any) {
			console.error('Error saving business information:', error);
			const errorMessage =
				error?.message ||
				error?.data?.message ||
				__('Failed to save business information', 'doublescale');
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


	return (
		<div className="flex flex-col gap-8">
			{/* Header */}
			<div>
				<h3 className="text-foreground text-2xl font-semibold mb-1">
					{__('Business Information', 'doublescale')}
				</h3>
				<p className="text-muted-foreground text-sm leading-relaxed">
					{__(
						"This will be used for your email campaigns and subscriber-facing pages.",
						'doublescale'
					)}
				</p>
			</div>
            {isLoading ? <BusinessFormSkeleton/> :
			<Form {...form}>
				<form onSubmit={handleNext} className="space-y-6">
					{/* Business Name */}
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm font-medium text-foreground">
									{__('Business Name', 'doublescale')}
								</FormLabel>
								<FormControl>
									<Input
										placeholder={__(
											'Enter your business name',
											'doublescale'
										)}
										{...field}
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
								<FormLabel className="text-sm font-medium text-foreground">
									{__('Business Address', 'doublescale')}
								</FormLabel>
								<FormControl>
									<Textarea
										placeholder={__(
											'Type your business address...',
											'doublescale'
										)}
										{...field}
										className="min-h-[160px] resize-none"
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
								<FormLabel className="text-sm font-medium text-foreground">
										{__('Logo', 'doublescale')}
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

					
				</form>
			</Form>
            }
			{/* Buttons */}
			<div className="flex justify-between pt-6 border-t border-border/40">
						<ButtonComponent
							onClick={handlePrevious}
							type=""
							disabled={isSubmitting}
						>
							{__('Previous', 'doublescale')}
						</ButtonComponent>
						<ButtonComponent
							type="go"
							onClick={handleNext}
							disabled={isSubmitting}
						>
							{isSubmitting
								? __('Saving...', 'doublescale')
								: __('Next Step', 'doublescale')}
						</ButtonComponent>
					</div>
		</div>
	);
}
