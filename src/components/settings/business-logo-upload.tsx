/**
 * Business logo upload for settings (WordPress media library).
 */

import { useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

import UploadImageIcon from '@doublescale/shared/icons/upload-image';
import { Button } from '@/components/ui/button';

interface BusinessLogoUploadProps {
	value: string;
	onChange: (url: string) => void;
	disabled?: boolean;
}

const uploadImageToMediaLibrary = async (file: File): Promise<string> => {
	const formData = new FormData();
	formData.append('file', file);

	const response = await apiFetch({
		path: '/wp/v2/media',
		method: 'POST',
		body: formData,
	});

	const attachment = response as {
		source_url?: string;
		url?: string;
	};

	const url = attachment.source_url || attachment.url;
	if (!url) {
		throw new Error(__('Failed to upload image', 'doublescale'));
	}

	return url;
};

export const BusinessLogoUpload: React.FC<BusinessLogoUploadProps> = ({
	value,
	onChange,
	disabled = false,
}) => {
	const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const displayImage = useMemo(() => {
		if (localPreviewUrl) {
			return localPreviewUrl;
		}
		return value || null;
	}, [localPreviewUrl, value]);

	const onDrop = async (acceptedFiles: File[]) => {
		const file = acceptedFiles[0];
		if (!file || disabled) {
			return;
		}

		setError(null);
		const previewUrl = URL.createObjectURL(file);
		setLocalPreviewUrl(previewUrl);
		setUploading(true);

		try {
			const uploadedUrl = await uploadImageToMediaLibrary(file);
			onChange(uploadedUrl);
			setLocalPreviewUrl(null);
		} catch (err: unknown) {
			setLocalPreviewUrl(null);
			setError(
				err instanceof Error
					? err.message
					: __('Failed to upload image', 'doublescale')
			);
		} finally {
			setUploading(false);
		}
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop: (files) => {
			void onDrop(files);
		},
		accept: { 'image/*': [] },
		multiple: false,
		disabled: disabled || uploading,
	});

	return (
		<div className="space-y-2">
			<div
				{...getRootProps()}
				className={`
					relative flex min-h-[200px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-3 text-center transition-all
					${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}
					${error ? '!border-destructive' : ''}
					${disabled || uploading ? 'pointer-events-none opacity-60' : ''}
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
							{uploading
								? __('Uploading…', 'doublescale')
								: __('Click or drag to replace', 'doublescale')}
						</p>
					</div>
				) : (
					<>
						<UploadImageIcon
							color="hsl(var(--primary))"
							width={48}
							height={48}
						/>
						<p className="mt-2 text-sm font-semibold text-primary">
							{__('Browse images', 'doublescale')}
							<span className="font-semibold text-foreground">
								{' '}
								{__('to upload', 'doublescale')}
							</span>
						</p>
						<p className="mt-2 text-sm leading-6 text-muted-foreground">
							{__('or drag and drop it here', 'doublescale')}
						</p>
					</>
				)}
			</div>

			{displayImage && !uploading ? (
				<div className="flex justify-end">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={disabled}
						onClick={() => {
							setLocalPreviewUrl(null);
							setError(null);
							onChange('');
						}}
					>
						{__('Remove logo', 'doublescale')}
					</Button>
				</div>
			) : null}

			{error ? (
				<p className="text-sm text-destructive">{error}</p>
			) : null}

			<p className="text-sm text-muted-foreground">
				{__(
					'Shown automatically on proposal and invoice templates.',
					'doublescale'
				)}
			</p>
		</div>
	);
};
