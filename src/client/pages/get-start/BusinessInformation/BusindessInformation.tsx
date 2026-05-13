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
import { Button } from '@/components/ui/button';
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
		<div className="flex h-full min-h-0 flex-1 flex-col space-y-2">
			<div
				{...getRootProps()}
				className={`
					relative flex h-full min-h-[200px] w-full flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-3 text-center transition-all
				${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}
				${error ? '!border-destructive' : ''}
				`}
			>
				<input {...getInputProps()} />

				{displayImage ? (
					<div className="space-y-4">
						<img
							src={displayImage}
							alt={__('Logo preview', 'doublescale')}
							className="h-32 w-32 rounded-lg border object-contain"
						/>
						<p className="text-sm text-muted-foreground">
							{__('Click or drag to replace', 'doublescale')}
						</p>
					</div>
				) : (
					<>
						<UploadImageIcon color="hsl(var(--primary))" width={48} height={48} />
						<p className="text-sm font-semibold text-primary mt-2">
							{__('Browse images', 'doublescale')}
							<span className="text-foreground font-semibold">
								{' '}{__('to upload', 'doublescale')}
							</span>
						</p>
						<p className="text-sm leading-6 text-muted-foreground mt-2">
							{__('or drag and drop it here', 'doublescale')}
						</p>
					</>
				)}
			</div>
			{error ? <p className="shrink-0 text-sm text-destructive">{error}</p> : null}
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
	 * @param options.silent When true (e.g. Back), omit success notice — only "Next" should toast.
	 * @returns whether settings were saved successfully
	 */
	const saveBusinessInformation = async (
		data: FormType,
		options?: { silent?: boolean }
	): Promise<boolean> => {
		try {
			let logoUrl = existingLogoUrl; // Keep existing logo by default

			// Upload image first if present (new file uploaded)
			if (data.image) {
				const uploadedUrl = await uploadImageToMediaLibrary(data.image);
				if (uploadedUrl) {
					logoUrl = uploadedUrl;
				} else {
					return false;
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

			if (!options?.silent) {
				createNotice({
					type: 'success',
					message: __(
						'Business information saved successfully',
						'doublescale'
					),
				});
			}

			return true;
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
			return false;
		}
	};

	const handleNext = form.handleSubmit(async (data) => {
		const ok = await saveBusinessInformation(data);
		if (ok) {
			onNext();
		}
	});

	const handlePrevious = form.handleSubmit(async (data) => {
		const ok = await saveBusinessInformation(data, { silent: true });
		if (ok) {
			onPrevious();
		}
	});

	const isSubmitting = form.formState.isSubmitting;


	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{/* Header */}
			<div className="shrink-0 pb-6">
				<h3 className="mb-2.5 text-2xl font-bold leading-9 text-foreground">
					{__('Please provide your business information', 'doublescale')}
				</h3>
				<p className="text-base font-medium leading-7 text-muted-foreground">
					{__(
						"This will be used for your email campaign, Subscriber's front pages, and more.",
						'doublescale'
					)}
				</p>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
				{isLoading ? (
					<BusinessFormSkeleton />
				) : (
					<Form {...form}>
						<form
							id="doublescale-get-start-business-form"
							onSubmit={handleNext}
							className="space-y-6 pb-4"
						>
							{/* Business Name */}
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-sm font-medium leading-6 text-foreground">
											{__('Business Name', 'doublescale')}
											<span className="text-xs text-destructive">*</span>
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

							{/* Grid: Address + Logo — equal height on md+ */}
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch md:gap-6">
								{/* Address */}
								<FormField
									control={form.control}
									name="address"
									render={({ field }) => (
										<FormItem className="flex h-full flex-col">
											<FormLabel className="py-0 text-sm font-medium leading-6 text-foreground">
												{__('Business Address', 'doublescale')}
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder={__(
														'Type your business address...',
														'doublescale'
													)}
													{...field}
													className="min-h-[200px] flex-1 resize-none"
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
									render={({ field }) => (
										<FormItem className="flex h-full flex-col">
											<FormLabel className="py-0 text-sm font-medium leading-6 text-foreground">
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
													existingLogoUrl={existingLogoUrl}
													error={
														form.formState.errors.image?.message
													}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
							</div>
						</form>
					</Form>
				)}
			</div>

			<div className="z-20 -mx-6 -mb-6 mt-6 shrink-0 bg-white px-6 py-4 shadow-[0_-8px_28px_rgba(15,23,42,0.07)] rounded-b-[20px]">
				<div className="flex items-center justify-end gap-6">
					<Button
						type="button"
						size="lg"
						variant="secondaryDeepBlue"
						disabled={isSubmitting || isLoading}
						onClick={() => {
							void handlePrevious();
						}}
					>
						{__('Back', 'doublescale')}
					</Button>
					<Button
						type="submit"
						size="lg"
						variant="default"
						form="doublescale-get-start-business-form"
						disabled={isSubmitting || isLoading}
					>
						{isSubmitting
							? __('Saving...', 'doublescale')
							: __('Next Step', 'doublescale')}
					</Button>
				</div>
			</div>
		</div>
	);
}
