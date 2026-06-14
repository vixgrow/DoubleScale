/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * external dependencies
 */
import React, { useRef, useState } from 'react';
import { Download } from 'lucide-react';

/**
 * internal dependencies
 */
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DeleteIcon } from '@doublescale/components';
import { useImportContext } from '../contexts';
import ConfigAPI from '@doublescale/config';
import { cn } from '@/lib/utils';
//@ts-ignore
import csvIcon from '@doublescale/assets/images/csv/icon.png';

const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const CsvUpload: React.FC = () => {
	const { state, dispatch, updateValues } = useImportContext();
	const { fileData, isFetching, isUploading, uploadProgress } = state;
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [fileInfo, setFileInfo] = useState<{
		file: File | null;
		uploadedSize: number;
	}>({
		file: null,
		uploadedSize: 0,
	});

	const uploadFile = async (file: File) => {
		const formData = new FormData();
		formData.append('file', file);
		dispatch({ type: 'SET_IS_UPLOADING', payload: true });
		dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: 0 });

		setFileInfo({ file, uploadedSize: 0 });

		try {
			let currentProgress = 0;
			const progressSimulation = setInterval(() => {
				if (currentProgress >= 90) {
					clearInterval(progressSimulation);
					return;
				}
				currentProgress += 10;
				const uploadedBytes = (currentProgress / 100) * file.size;
				setFileInfo((prev) => ({
					...prev,
					uploadedSize: uploadedBytes,
				}));
				dispatch({
					type: 'SET_UPLOAD_PROGRESS',
					payload: currentProgress,
				});
			}, 200);

			const response = await apiFetch({
				path: addQueryArgs('/doublescale/v1/import-export/upload'),
				method: 'POST',
				body: formData,
			});

			clearInterval(progressSimulation);
			dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: 100 });
			setFileInfo((prev) => ({ ...prev, uploadedSize: file.size }));

			setTimeout(() => {
				const typedResponse = response as {
					file_name: string;
					header_columns: string[];
				};
				dispatch({ type: 'SET_FILE_DATA', payload: typedResponse });
				updateValues('file_name', typedResponse.file_name);

				const importers = ConfigAPI.getImporters();
				const csvImporter = importers['csv'];
				if (csvImporter && csvImporter.fields) {
					dispatch({
						type: 'SET_SOURCE_DATA',
						payload: csvImporter.fields,
					});
				}
			}, 100);
		} catch (error) {
			console.error('Upload error:', error);
		} finally {
			setTimeout(() => {
				dispatch({ type: 'SET_IS_UPLOADING', payload: false });
				dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: 0 });
			}, 500);
		}
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file && file.type === 'text/csv') {
			uploadFile(file);
		} else if (file) {
			console.error('Please select a CSV file');
		}
	};

	const handleUploadClick = () => {
		if (!isUploading) {
			fileInputRef.current?.click();
		}
	};

	const handleDragOver = (event: React.DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
	};

	const handleDrop = (event: React.DragEvent) => {
		event.preventDefault();
		event.stopPropagation();

		const files = event.dataTransfer.files;
		const file = files[0];

		if (file && file.type === 'text/csv') {
			uploadFile(file);
		} else if (file) {
			console.error('Please select a CSV file');
		}
	};

	const removeFile = () => {
		dispatch({ type: 'SET_FILE_DATA', payload: null });
		setFileInfo({ file: null, uploadedSize: 0 });
		updateValues('file_name', '');
	};

	const renderUploadArea = () => (
		<div
			className={cn(
				'cursor-pointer rounded-2xl border-2 border-dashed border-border bg-white p-6 text-center transition-colors',
				'hover:border-primary sm:p-14'
			)}
			onClick={handleUploadClick}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
		>
			<Input
				ref={fileInputRef}
				type="file"
				accept=".csv"
				onChange={handleFileChange}
				className="hidden"
				disabled={isUploading}
			/>
			<div className="flex flex-col items-center gap-4">
				<div className="flex items-center justify-center">
					<img src={csvIcon} alt="" className="h-14 w-14 object-contain" />
				</div>
				<div className="space-y-1">
					<h3 className="text-base font-semibold text-foreground">
						{__('Select CSV file to import', 'doublescale')}
					</h3>
					<p className="text-sm text-muted-foreground">
						{__('or drag and drop it here', 'doublescale')}
					</p>
				</div>
			</div>
		</div>
	);

	const hasUploadedFile =
		Boolean(fileData) || Boolean(fileInfo.file) || isUploading;

	const renderFileCard = () => {
		const fileName =
			fileInfo.file?.name || fileData?.file_name || '';
		const totalBytes = fileInfo.file?.size ?? 0;
		const totalSize = totalBytes ? formatFileSize(totalBytes) : '';
		const uploadedSize = formatFileSize(fileInfo.uploadedSize);
		const isComplete = !isUploading && Boolean(fileData);
		const sizeLabel = totalSize
			? `${uploadedSize} ${__('of', 'doublescale')} ${totalSize}`
			: '';

		return (
			<div className="import-modal-csv-file max-sm:p-4">
				<div className="import-modal-csv-file__row max-sm:flex-col max-sm:gap-3 max-sm:justify-center max-sm:items-center">
					<img
						src={csvIcon}
						alt=""
						className="import-modal-csv-file__icon max-sm:hidden"
					/>
					<div className="import-modal-csv-file__info">
						<p className="import-modal-csv-file__name-row">
							<span className="import-modal-csv-file__name">
								{fileName}
							</span>
							{sizeLabel ? (
								<>
									<span className="import-modal-csv-file__separator max-[1200px]:hidden"
										aria-hidden
									>
										{' - '}
									</span>
									<span className="import-modal-csv-file__size">
										{sizeLabel}
									</span>
								</>
							) : null}
						</p>
						{isUploading ? (
							<div className="import-modal-csv-file__uploading">
								<span className="import-modal-csv-file__status import-modal-csv-file__status--uploading">
									{__('Uploading...', 'doublescale')}
								</span>
								<Progress
									value={uploadProgress}
									className="import-modal-csv-file__progress"
								/>
							</div>
						) : isComplete ? (
							<span className="import-modal-csv-file__badge">
								{__('Completed', 'doublescale')}
							</span>
						) : null}
					</div>
					<button
						type="button"
						onClick={removeFile}
						className="import-modal-csv-file__remove"
						aria-label={__('Remove file', 'doublescale')}
						disabled={isUploading}
					>
						<DeleteIcon width={20} height={20} />
					</button>
				</div>
			</div>
		);
	};

	const exampleCsv = `first_name,last_name,email\nJohn,Doe,john@example.com`;

	const handleDownloadExample = () => {
		const blob = new Blob([exampleCsv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'doublescale-contacts-example.csv';
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 bg-[#F7F8FA] rounded-xl p-6 border border-border">
				<div className=" flex max-sm:flex-col max-sm:gap-3 items-center gap-6 justify-between">
					<div className='min-w-0 space-y-3'>
						<CardTitle className="text-xl font-semibold leading-8 text-foreground">
							{__('Upload CSV file', 'doublescale')}
						</CardTitle>
						<CardDescription className="text-base leading-7 text-muted-foreground">
							{__(
								'Your file must include a column with either first name, last name and etc... for each contact. (Maximum file size 12 MB)',
								'doublescale'
							)}
						</CardDescription>
					</div>
					<Button
						type="button"
						variant="secondaryDeepBlue"
						onClick={handleDownloadExample}
					>
						<Download className="h-4 w-4" aria-hidden />
						{__('Download example file (.csv)', 'doublescale')}
					</Button>
				</div>
				{isFetching && <Skeleton className="h-40 w-full rounded-lg" />}
				{!isFetching &&
					(hasUploadedFile ? renderFileCard() : renderUploadArea())}
			</div>



		</div>
	);
};

export default CsvUpload;
