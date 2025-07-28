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
import { CircleX } from 'lucide-react';

/**
 * internal dependencies
 */
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { CheckCircleIcon, DeleteIcon } from '@quillcrm/components';
import LoadingSpinner from '../loading-spin';
import { useImportContext } from '../contexts';
//@ts-ignore
import csvIcon from '../../../../../assets/images/csv/csv.png';

// Utility function to format file size
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

	// Store file information locally
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

		// Store file info for size display
		setFileInfo({ file, uploadedSize: 0 });

		try {
			// Simulate progress for fetch (since fetch doesn't support upload progress natively)
			let currentProgress = 0;
			const progressSimulation = setInterval(() => {
				if (currentProgress >= 90) {
					clearInterval(progressSimulation);
					return;
				}
				currentProgress += 10;
				// Update uploaded size based on progress
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
				path: addQueryArgs('/qc/v1/import-export/upload'),
				method: 'POST',
				body: formData,
			});

			clearInterval(progressSimulation);
			dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: 100 });
			setFileInfo((prev) => ({ ...prev, uploadedSize: file.size }));

			// Small delay to show 100% completion
			setTimeout(() => {
				const typedResponse = response as {
					file_name: string;
					header_columns: string[];
				};
				dispatch({ type: 'SET_FILE_DATA', payload: typedResponse });
				updateValues('file_name', typedResponse.file_name);
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
			className="border-2 border-dashed border-[#9CA6AF80] rounded-2xl p-20 text-center hover:border-gray-400 transition-colors cursor-pointer"
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
			<div className="flex flex-col items-center space-y-4">
				<div className="flex items-center justify-center">
					<img src={csvIcon} alt="Default" className="w-16 h-16" />
				</div>
				<div>
					<h3 className="text-2xl font-normal text-[#09090B]">
						{__('Select CSV file to import', 'quillcrm')}
					</h3>
					<p className="text-base text-[#979797]">
						{__('or drag and drop it here', 'quillcrm')}
					</p>
				</div>
			</div>
		</div>
	);

	const renderFileCard = () => {
		const totalSize = fileInfo.file
			? formatFileSize(fileInfo.file.size)
			: '';
		const uploadedSize = formatFileSize(fileInfo.uploadedSize);

		return (
			<div className="flex flex-col items-center">
				<Card className="w-full p-8 rounded-xl shadow-none">
					<CardHeader className="p-0 mb-2 flex flex-row items-center justify-between">
						<span className="text-3xl text-[#292D32] truncate">
							{fileData?.file_name}
						</span>
						<div
							onClick={removeFile}
							className="cursor-pointer text-[#292D32]"
						>
							{isUploading ? (
								<CircleX className="w-[30px] h-[30px]" />
							) : (
								<DeleteIcon width={30} height={30} />
							)}
						</div>
					</CardHeader>

					<CardContent className="p-0">
						{isUploading ? (
							<>
								<div className="flex items-center gap-2 text-2xl text-[#3EBF8F] mt-2">
									<div className="text-[#A9ACB4]">
										{uploadedSize} of {totalSize} •
									</div>
									<LoadingSpinner size={24} />
									<div className="text-[#292D32]">
										{__('Uploading...', 'quillcrm')}
									</div>
								</div>
								<Progress
									value={uploadProgress}
									className="w-full h-2"
								/>
							</>
						) : (
							<div className="flex items-center gap-2 text-2xl text-[#3EBF8F] mt-2">
								<div className="text-[#A9ACB4]">
									{totalSize} •
								</div>
								<CheckCircleIcon />
								<div className="text-[#292D32]">
									{__('Completed', 'quillcrm')}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		);
	};

	return (
		<div>
			<div className="mb-6">
				<CardTitle className="text-2xl font-normal text-[#09090B]">
					{__('Upload CSV file', 'quillcrm')}
				</CardTitle>
				<CardDescription className="text-[#71717A] text-base mb-4">
					{__(
						'Your file must include a column with either first name, last name and email addresses for each contact. (Maximum file size 12 MB.)',
						'quillcrm'
					)}
				</CardDescription>
			</div>

			{isFetching && <Skeleton className="h-40 w-full" />}

			{!isFetching && (
				<>{!fileData ? renderUploadArea() : renderFileCard()}</>
			)}

			<div className="mt-6 text-center">
				<p className="text-lg text-[#71717A] mb-2">
					{__('Learn more or', 'quillcrm')}
					<a
						href="#"
						className="text-[#3B82F6] hover:text-blue-700 ml-1"
					>
						{__('Download example file', 'quillcrm')}
					</a>
				</p>
			</div>
		</div>
	);
};

export default CsvUpload;
