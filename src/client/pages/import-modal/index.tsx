/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Upload } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	CheckCircleIcon,
	ContactMappedFields,
	DeleteIcon,
	Field,
	ImportProgressIcon,
	InstallIcon,
	LoadingSpinner,
} from '@quillcrm/components';
import { useEffect } from 'react';
import ConfigAPI from '@quillcrm/config';
import type { ImporterField } from '@quillcrm/config';
import { isEmpty, map, trim } from 'lodash';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from '@/components/ui/card';
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from '@/components/ui/table';
import {
	ArrowRight,
	ArrowLeft,
	ChevronRight,
	CircleX,
	ArrowUpLeft,
} from 'lucide-react';
//@ts-ignore
import csvIcon from '../../../../assets/images/csv/csv.png';
//@ts-ignore
import wpusersIcon from '../../../../assets/images/wordpress/wordpress-icon.png';
//@ts-ignore
import wcCustomersIcon from '../../../../assets/images/woocoomerce/woo-icon.png';
//@ts-ignore
import funnelkitIcon from '../../../../assets/images/funnelkit/funnelkit-icon.png';
//@ts-ignore
import fluentcrmIcon from '../../../../assets/images/fluent-crm/fluent-icon.png';
//@ts-ignore
import mailerliteIcon from '../../../../assets/images/mailer-lite/mailer-icon.png';
//@ts-ignore
import activecampaignIcon from '../../../../assets/images/active-campaign/active-icon.png';
//@ts-ignore
import wpusersLogo from '../../../../assets/images/wordpress/wordpress.png';
//@ts-ignore
import wcCustomersLogo from '../../../../assets/images/woocoomerce/woocommerce.png';
//@ts-ignore
import funnelkitLogo from '../../../../assets/images/funnelkit/funnelkit.png';
//@ts-ignore
import fluentcrmLogo from '../../../../assets/images/fluent-crm/fluentcrm.png';
//@ts-ignore
import mailerliteLogo from '../../../../assets/images/mailer-lite/mailer.png';
//@ts-ignore
import activecampaignLogo from '../../../../assets/images/active-campaign/activecampaign.png';

interface Props {
	open: boolean;
	onClose: () => void;
	onCompleted: () => void;
}

const ImportModal: React.FC<Props> = ({ open, onClose, onCompleted }) => {
	const [currentStep, setCurrentStep] = useState(1);
	const [importing, setImporting] = useState(false);
	const [count, setCount] = useState(0);
	const [source, setSource] = useState('csv');
	const { createNotice } = useDispatch('quillcrm/core');
	const [offset, setOffset] = useState(0);
	const [fileData, setFileData] = useState<{
		file_name: string;
		header_columns: string[];
	} | null>(null);
	const [isFetching, setIsFetching] = useState(false);
	const [sourceData, setSourceData] = useState<{
		[key: string]: ImporterField;
	} | null>(null);
	const [credentials, setCredentials] = useState({});
	const [assignedLists, setAssignedLists] = useState<number[]>([]);
	const [assignedTags, setAssignedTags] = useState<number[]>([]);
	const [newStatus, setNewStatus] = useState<string>('unverified');
	const [updateExisting, setUpdateExisting] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const importers = ConfigAPI.getImporters();
	const importer = importers[source] || null;
	const [values, setValues] = useState({});

	const sourceLogos = {
		csv: {
			src: csvIcon,
			alt: 'CSV',
			className: 'h-8 w-8',
		},
		wpusers: {
			src: wpusersLogo,
			alt: 'WordPress Users',
			className: 'h-9 w-[137px]',
		},
		wc_customers: {
			src: wcCustomersLogo,
			alt: 'WooCommerce Customers',
			className: 'h-8 w-[136px]',
		},
		wpfunnelkit: {
			src: funnelkitLogo,
			alt: 'FunnelKit',
			className: 'h-8 w-[136px]',
		},
		fluentcrm: {
			src: fluentcrmLogo,
			alt: 'FluentCRM',
			className: 'h-7 w-[136px]',
		},
		mailerlite: {
			src: mailerliteLogo,
			alt: 'MailerLite',
			className: 'h-8 w-[126px]',
		},
		activecampaign: {
			src: activecampaignLogo,
			alt: 'ActiveCampaign',
			className: 'h-8 w-[195px]',
		},
	};

	const getSourceIcon = (sourceKey: string) => {
		const iconMap = {
			csv: <img src={csvIcon} alt="CSV" className="w-10 h-10" />,
			wpusers: (
				<img
					src={wpusersIcon}
					alt="WordPress Users"
					className="w-10 h-10"
				/>
			),
			wc_customers: (
				<img
					src={wcCustomersIcon}
					alt="WooCommerce Customers"
					className="w-10 h-6"
				/>
			),
			wpfunnelkit: (
				<img src={funnelkitIcon} alt="FunnelKit" className="w-10 h-6" />
			),
			fluentcrm: (
				<img
					src={fluentcrmIcon}
					alt="FluentCRM"
					className="w-10 h-10"
				/>
			),
			mailerlite: (
				<img
					src={mailerliteIcon}
					alt="MailerLite"
					className="w-10 h-10"
				/>
			),
			activecampaign: (
				<img
					src={activecampaignIcon}
					alt="ActiveCampaign"
					className="w-10 h-10"
				/>
			),
		};
		return (
			iconMap[sourceKey] || (
				<img src={csvIcon} alt="Default" className="w-10 h-10" />
			)
		);
	};

	const sources = map(importers, (importer, slug) => ({
		label: importer.name,
		value: slug,
		disabled: !importer.is_active,
		icon: getSourceIcon(slug),
		requiresCredentials: ['mailerlite', 'activecampaign'].includes(slug),
	}));

	const statusOptions = [
		{ label: __('Subscribed', 'quillcrm'), value: 'subscribed' },
		{ label: __('Unsubscribed', 'quillcrm'), value: 'unsubscribed' },
		{ label: __('Bounced', 'quillcrm'), value: 'bounced' },
		{ label: __('Unverified', 'quillcrm'), value: 'unverified' },
	];

	const importContacts = async (currentOffset = 0) => {
		setImporting(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/import-export/import'),
				method: 'POST',
				data: {
					source,
					offset: currentOffset,
					lists: assignedLists,
					tags: assignedTags,
					status: newStatus,
					update_existing: updateExisting,
					...values,
					credentials,
				},
			})) as { total: string; offset: number; status: string };

			setCount(parseInt(response.total));
			setOffset(response.offset);
			if (response.status === 'in_progress') {
				setTimeout(() => importContacts(response.offset), 3000);
			} else {
				createNotice({
					type: 'success',
					message: __('Import completed', 'quillcrm'),
				});
				setImporting(false);
				setCount(0);
				setOffset(0);
				resetState();
				onClose();
				onCompleted();
			}
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to import contacts', 'quillcrm'),
			});
			setImporting(false);
		}
	};

	const resetState = () => {
		setFileData(null);
		setValues({});
		setAssignedLists([]);
		setAssignedTags([]);
		setCredentials({});
		setNewStatus('unverified');
		setUpdateExisting(false);
		setSource('csv');
		setCurrentStep(1);
		setUploadProgress(0);
		setIsUploading(false);
	};

	const uploadFile = async ({ file, onSuccess, onError }) => {
		const formData = new FormData();
		formData.append('file', file);
		setIsUploading(true);
		setUploadProgress(0);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/import-export/upload'),
				method: 'POST',
				body: formData,
				onUploadProgress: (progressEvent) => {
					const percentCompleted = Math.round(
						(progressEvent.loaded * 100) / progressEvent.total
					);
					setUploadProgress(percentCompleted);
				},
			})) as { file_name: string; header_columns: string[] };

			onSuccess();
			setFileData(response);
			setValues({
				...values,
				file_name: response.file_name,
			});
		} catch (error) {
			onError(error);
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
		}
	};

	const removeFile = () => {
		setFileData(null);
		setValues({
			...values,
			file_name: '',
		});
	};

	const prepareFields = (fields: string[]) => {
		return fields.reduce((acc, field) => {
			acc[field] = { label: field };
			return acc;
		}, {});
	};

	const getSourceData = async () => {
		if (
			!importer ||
			(importer.is_integration && !validateCredentials()) ||
			(!importer.is_integration && isEmpty(importer.fields))
		) {
			return;
		}

		if (!importer.is_integration && !isEmpty(importer.fields)) {
			setSourceData(importer.fields);
			return;
		}

		setIsFetching(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/qc/v1/import-export/${source}`, {
					credentials,
				}),
			})) as {
				[key: string]: ImporterField;
			};

			setSourceData(response);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsFetching(false);
		}
	};

	useEffect(() => {
		getSourceData();
	}, [source]);

	const checkConditions = (conditions) => {
		if (!conditions) {
			return true;
		}

		const { relation = 'and', rules = [] } = conditions;

		for (let i = 0; i < rules.length; i++) {
			const rule = rules[i];

			if (
				!checkCondition(rule.field, rule.operator, rule.value) &&
				relation === 'and'
			) {
				return false;
			}
		}

		return true;
	};

	const checkCondition = (field, operator, value) => {
		if (!values) {
			return false;
		}

		switch (operator) {
			case '==':
				return values[field] === value;
			case '!=':
				return values[field] !== value;
			case 'contains':
				return values[field].includes(value);
			case 'not_contains':
				return !values[field].includes(value);
			case 'empty':
				return !values[field];
			case 'not_empty':
				return !!values[field];
			default:
				return false;
		}
	};

	const getFieldContent = (field: ImporterField, key: string) => {
		if (!field) {
			return null;
		}

		if (field.conditions && !checkConditions(field.conditions)) {
			return null;
		}

		let fieldContent;

		switch (field.type) {
			case 'lists_mapping':
				fieldContent = (
					<ListsMapping
						lists={field.options.map((option) => option.label)}
						mapping={values[key] || []}
						onChange={(value) => {
							setValues({ ...values, [key]: value });
						}}
					/>
				);
				break;
			case 'tags_mapping':
				fieldContent = (
					<TagsMapping
						tags={field.options.map((option) => option.label)}
						mapping={values[key] || []}
						onChange={(value) => {
							setValues({ ...values, [key]: value });
						}}
					/>
				);
				break;
			case 'file':
				fieldContent = (
					<>
						{!fileData ? (
							<div className="border-2 border-dashed border-[#9CA6AF80] rounded-2xl p-20 text-center hover:border-gray-400 transition-colors">
								<Upload
									accept=".csv"
									multiple={false}
									customRequest={({
										file,
										onSuccess,
										onError,
									}) => {
										uploadFile({
											file,
											onSuccess,
											onError,
										});
									}}
									showUploadList={false}
									disabled={isUploading}
								>
									<div className="flex flex-col items-center space-y-4">
										<div className="flex items-center justify-center">
											<img
												src={csvIcon}
												alt="Default"
												className="w-16 h-16"
											/>
										</div>
										<div>
											<h3 className="text-2xl font-normal text-[#09090B]">
												{__(
													'Select CSV file to import',
													'quillcrm'
												)}
											</h3>
											<p className="text-base text-[#979797]">
												{__(
													'or drag and drop it here',
													'quillcrm'
												)}
											</p>
										</div>
									</div>
								</Upload>
							</div>
						) : (
							<div className="flex flex-col items-center">
								<Card className="w-full p-8 rounded-xl shadow-none">
									<CardHeader className="p-0 mb-2 flex flex-row items-center justify-between">
										<span className="text-3xl text-[#292D32] truncate">
											{fileData.file_name}
										</span>
										<div
											onClick={removeFile}
											className="cursor-pointer text-[#292D32]"
										>
											{isUploading ? (
												<CircleX className="w-[30px] h-[30px]" />
											) : (
												<DeleteIcon
													width={30}
													height={30}
												/>
											)}
										</div>
									</CardHeader>

									<CardContent className="p-0">
										{isUploading ? (
											<>
												<div className="flex items-center gap-2 text-2xl text-[#3EBF8F] mt-2">
													<div className="text-[#A9ACB4]">
														60 KB of 92O KB •
													</div>
													<LoadingSpinner size={24} />
													<div className="text-[#292D32]">
														{__(
															'Uploading...',
															'quillcrm'
														)}
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
													60 KB of 92O KB •
												</div>
												<CheckCircleIcon />
												<div className="text-[#292D32]">
													{__(
														'Completed',
														'quillcrm'
													)}
												</div>
											</div>
										)}
									</CardContent>
								</Card>
							</div>
						)}
					</>
				);
				break;
			case 'select':
				fieldContent = (
					<Field
						type="select"
						value={values[key]}
						onChange={(value) => {
							setValues({ ...values, [key]: value });
						}}
						options={field.options.map((option) => ({
							label: option.label,
							value: option.key,
						}))}
					/>
				);
				break;
			case 'text':
				fieldContent = (
					<Field
						type="text"
						value={values[key]}
						onChange={(value) => {
							setValues({ ...values, [key]: value });
						}}
					/>
				);
				break;
			case 'contact_mapped_fields':
				const fields =
					source === 'csv' && fileData
						? prepareFields(fileData.header_columns)
						: field.options;
				fieldContent = (
					<ContactMappedFields
						fields={fields}
						values={values[key] || {}}
						onChange={(value) => {
							setValues({ ...values, [key]: value });
						}}
					/>
				);
				break;
			default:
				fieldContent = null;
				break;
		}

		return (
			<div className="space-y-3">
				<label className="text-base">{field.label}</label>
				{fieldContent}
			</div>
		);
	};

	const validateCredentials = () => {
		if (!importer) {
			return false;
		}

		const currentSource = sources.find((s) => s.value === source);
		if (!currentSource?.requiresCredentials) {
			return true;
		}

		for (const key in importer.credentials) {
			if (!credentials[key] || isEmpty(trim(credentials[key]))) {
				return false;
			}
		}

		return true;
	};

	const displayContactProfile = () => {
		if (!importer) {
			return false;
		}

		if (isFetching || importing) {
			return false;
		}

		if (
			importer.is_integration &&
			(!validateCredentials() || !sourceData)
		) {
			return false;
		}

		return true;
	};

	useEffect(() => {
		setCurrentStep(1);
		if (source !== 'csv') {
			setFileData(null);
			setValues((prevValues) => ({
				...prevValues,
				file_name: '',
			}));
		}
	}, [source]);

	const canProceedToStep2 = () => {
		if (!importer) return false;

		if (source !== 'csv') return false;

		if (source === 'csv' && !fileData) {
			return false;
		}

		return true;
	};

	const handleNext = () => {
		if (canProceedToStep2()) {
			setCurrentStep(2);
		} else if (source !== 'csv') {
			importContacts();
		}
	};

	const handleBack = () => {
		setCurrentStep(1);
	};

	const renderRightCardContent = () => {
		if (importing) {
			return (
				<div className="w-full h-full flex flex-col items-start justify-start">
					<p className="text-[#09090B] text-2xl text-start">
						{__(
							`Importing ${importer?.name || source} Contacts`,
							'quillcrm'
						)}
					</p>
					<span className="text-lg text-[#71717A]">
						{__(
							'the list, tags will be assigned to contacts and status of Quill CRM contacts profile.',
							'quillcrm'
						)}
					</span>
					<Card className="w-full p-6 mt-6 shadow-none">
						<CardHeader className="text-center">
							<div className="flex items-center justify-center mx-auto mb-6">
								{source === 'csv' ? (
									<img
										src={csvIcon}
										alt="Default"
										className="w-16 h-16"
									/>
								) : (
									<ImportProgressIcon />
								)}
							</div>
							<CardTitle className="text-2xl text-[#09090B] font-normal">
								{__('Import Contacts...', 'quillcrm')}
							</CardTitle>
						</CardHeader>

						<CardContent className="space-y-2">
							<div className="flex justify-center gap-2 items-center text-lg text-[#71717A]">
								<div className="flex justify-center">
									<LoadingSpinner size={24} />
								</div>
								<span>{__('In Progress', 'quillcrm')}</span>
							</div>

							<div className="text-center text-sm text-[#71717A]">
								{__(
									'you will be redirecting to contacts list after importing data .',
									'quillcrm'
								)}
							</div>

							<Progress
								value={
									count > 0
										? parseInt(
												(
													(offset / count) *
													100
												).toFixed(2)
											)
										: 0
								}
								className="w-full"
							/>
						</CardContent>
					</Card>
				</div>
			);
		}
		if (currentStep === 1) {
			return (
				<>
					{source === 'csv' ? (
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
								<>
									{!fileData ? (
										<div className="border-2 border-dashed border-[#9CA6AF80] rounded-2xl p-20 text-center hover:border-gray-400 transition-colors">
											<Upload
												accept=".csv"
												multiple={false}
												customRequest={({
													file,
													onSuccess,
													onError,
												}) => {
													uploadFile({
														file,
														onSuccess,
														onError,
													});
												}}
												showUploadList={false}
												disabled={isUploading}
											>
												<div className="flex flex-col items-center space-y-4">
													<div className="flex items-center justify-center">
														<img
															src={csvIcon}
															alt="Default"
															className="w-16 h-16"
														/>
													</div>
													<div>
														<h3 className="text-2xl font-normal text-[#09090B]">
															{__(
																'Select CSV file to import',
																'quillcrm'
															)}
														</h3>
														<p className="text-base text-[#979797]">
															{__(
																'or drag and drop it here',
																'quillcrm'
															)}
														</p>
													</div>
												</div>
											</Upload>
										</div>
									) : (
										<div className="flex flex-col items-center">
											<Card className="w-full p-8 rounded-xl shadow-none">
												<CardHeader className="p-0 mb-2 flex flex-row items-center justify-between">
													<span className="text-3xl text-[#292D32] truncate">
														{fileData.file_name}
													</span>
													<div
														onClick={removeFile}
														className="cursor-pointer text-[#292D32]"
													>
														{isUploading ? (
															<CircleX className="w-[30px] h-[30px]" />
														) : (
															<DeleteIcon
																width={30}
																height={30}
															/>
														)}
													</div>
												</CardHeader>

												<CardContent className="p-0">
													{isUploading ? (
														<>
															<div className="flex items-center gap-2 text-2xl text-[#3EBF8F] mt-2">
																<div className="text-[#A9ACB4]">
																	60 KB of 92O
																	KB •
																</div>
																<LoadingSpinner
																	size={24}
																/>
																<div className="text-[#292D32]">
																	{__(
																		'Uploading...',
																		'quillcrm'
																	)}
																</div>
															</div>
															<Progress
																value={
																	uploadProgress
																}
																className="w-full h-2"
															/>
														</>
													) : (
														<div className="flex items-center gap-2 text-2xl text-[#3EBF8F] mt-2">
															<div className="text-[#A9ACB4]">
																60 KB of 92O KB
																•
															</div>
															<CheckCircleIcon />
															<div className="text-[#292D32]">
																{__(
																	'Completed',
																	'quillcrm'
																)}
															</div>
														</div>
													)}
												</CardContent>
											</Card>
										</div>
									)}
								</>
							)}

							<div className="mt-6 text-center">
								<p className="text-lg text-[#71717A] mb-2">
									{__('Learn more or', 'quillcrm')}
									<a
										href="#"
										className="text-[#3B82F6] hover:text-blue-700 ml-1"
									>
										{__(
											'Download example file',
											'quillcrm'
										)}
									</a>
								</p>
							</div>
						</div>
					) : (
						<div>
							{isFetching && <Skeleton className="h-40 w-full" />}

							{importer &&
								['mailerlite', 'activecampaign'].includes(
									source
								) &&
								!isEmpty(importer.credentials) &&
								!importing &&
								!isFetching && (
									<div className="space-y-6">
										<Card className="space-y-4 p-6 shadow-none rounded-2xl">
											<CardHeader className="p-0 mb-4">
												<CardTitle className="text-2xl font-normal text-[#09090B]">
													{importer.name}{' '}
													{__(
														'Data Import Tool',
														'quillcrm'
													)}
												</CardTitle>
												<div className="text-[#71717A] text-lg">
													{__(
														'Start syncing your contacts to the Quill CRM using your API key.',
														'quillcrm'
													)}
												</div>
											</CardHeader>

											<CardContent className="p-0 space-y-4">
												{map(
													importer.credentials,
													(field, key) => (
														<Field
															key={key}
															label={field.label}
															type={field.type}
															value={
																credentials[key]
															}
															onChange={(
																value
															) => {
																setCredentials({
																	...credentials,
																	[key]: value,
																});
															}}
														/>
													)
												)}
											</CardContent>
										</Card>
										<Card className="bg-[#F6F6F6] rounded-xl shadow-none border border-gray-200">
											<CardContent className="p-6 space-y-3">
												<CardTitle className="text-2xl font-normal text-[#09090B] mb-2">
													{__(
														'Find your API key',
														'quillcrm'
													)}
												</CardTitle>

												<ul className="list-decimal list-inside text-lg text-[#71717A] space-y-1">
													<li>
														{__(
															`Sign in to your ${importer.name} account.`,
															'quillcrm'
														)}
													</li>
													<li>
														{__(
															`Go to API Keys under Extras section of your ${importer.name} account.`,
															'quillcrm'
														)}
													</li>
													<li>
														{__(
															'Copy an existing API key or click the Create A Key button.',
															'quillcrm'
														)}
													</li>
												</ul>

												<a
													href="#"
													className="inline-flex items-center text-base text-[#274C77] hover:underline mt-2"
												>
													<ArrowUpLeft className="w-4 h-4 mr-1" />
													{__(
														'In-depth Document guide',
														'quillcrm'
													)}
												</a>
											</CardContent>
										</Card>
									</div>
								)}

							{!importing &&
								!isFetching &&
								!['mailerlite', 'activecampaign'].includes(
									source
								) && (
									<div className="space-y-6">
										{(() => {
											const filteredFields = sourceData
												? Object.entries(
														sourceData
													).filter(([key, field]) => {
														if (
															source !== 'csv' &&
															(field.type ===
																'file' ||
																field.type ===
																	'contact_mapped_fields')
														) {
															return false;
														}

														if (
															[
																'wpusers',
																'wc_customers',
															].includes(
																source
															) &&
															(field.type ===
																'lists_mapping' ||
																field.type ===
																	'tags_mapping')
														) {
															return false;
														}

														return true;
													})
												: [];

											if (filteredFields.length === 0)
												return null;

											return (
												<Card className="shadow-none rounded-2xl">
													<CardHeader>
														<CardTitle className="text-2xl font-normal text-[#09090B]">
															{__(
																`${importer.name} Data Import Tool`,
																'quillcrm'
															)}
														</CardTitle>
														<div className="text-lg text-[#71717A]">
															{__(
																'Select the column field you want to Mapping it on the system to import. ',
																'quillcrm'
															)}
														</div>
													</CardHeader>
													<CardContent className="space-y-6">
														{filteredFields.map(
															([key, field]) =>
																getFieldContent(
																	field,
																	key
																)
														)}
													</CardContent>
												</Card>
											);
										})()}

										<Card className="shadow-none rounded-2xl">
											<CardHeader>
												<CardTitle className="text-2xl font-normal text-[#09090B]">
													{__(
														'Contact Profile',
														'quillcrm'
													)}
												</CardTitle>
												<div className="text-lg text-[#71717A]">
													{__(
														'Configure how contacts will be organized in Quill CRM',
														'quillcrm'
													)}
												</div>
											</CardHeader>
											<CardContent className="space-y-6">
												<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
													<Field
														label={__(
															'Assign to Lists',
															'quillcrm'
														)}
														type="lists"
														value={assignedLists}
														onChange={
															setAssignedLists
														}
														required={false}
													/>
													<Field
														label={__(
															'Assign to Tags',
															'quillcrm'
														)}
														type="tags"
														value={assignedTags}
														onChange={
															setAssignedTags
														}
														required={false}
													/>
												</div>
												<div className="space-y-4">
													{[
														'csv',
														'wpusers',
														'wc_customers',
													].includes(source) && (
														<Field
															label={__(
																'Status',
																'quillcrm'
															)}
															type="select"
															value={newStatus}
															onChange={
																setNewStatus
															}
															options={
																statusOptions
															}
															required={false}
														/>
													)}

													<div className="flex gap-3 items-center">
														<Field
															type="switch"
															value={
																updateExisting
															}
															onChange={
																setUpdateExisting
															}
															required={false}
														/>
														<div className="text-[#09090B] font-normal text-base">
															{__(
																'Update Existing Contacts',
																'quillcrm'
															)}
														</div>
													</div>
												</div>
											</CardContent>
										</Card>
									</div>
								)}
						</div>
					)}

					<div className="mt-10 flex justify-end">
						{['mailerlite', 'activecampaign'].includes(source) ? (
							<Button
								onClick={getSourceData}
								disabled={
									!validateCredentials() ||
									isFetching ||
									isUploading ||
									importing
								}
								className="flex items-center space-x-2"
							>
								<span>{__('Fetch Data', 'quillcrm')}</span>
								<ArrowRight className="w-4 h-4" />
							</Button>
						) : (
							<Button
								onClick={handleNext}
								disabled={
									(source === 'csv' &&
										!canProceedToStep2()) ||
									(['wpfunnelkit', 'fluentcrm'].includes(
										source
									) &&
										!sourceData) ||
									isFetching ||
									isUploading ||
									importing
								}
								className="flex items-center space-x-2"
							>
								<span>
									{source === 'csv'
										? __('Next', 'quillcrm')
										: __('Import Contacts', 'quillcrm')}
								</span>
								<ArrowRight className="w-4 h-4" />
							</Button>
						)}
					</div>
				</>
			);
		}

		return (
			<div className="w-full">
				<div className="max-w-4xl mx-auto">
					{source === 'csv' && fileData && (
						<Card className="shadow-none rounded-2xl mb-8">
							<CardHeader>
								<CardTitle className="text-2xl font-normal text-[#09090B]">
									{__('Mapping the file', 'quillcrm')}
								</CardTitle>
								<p className="text-lg text-[#71717A]">
									{__(
										'Select the column field you want to map it on the system to import.',
										'quillcrm'
									)}
								</p>
							</CardHeader>

							<CardContent className="space-y-6">
								{importer && sourceData && (
									<div>
										{map(
											sourceData,
											(field, key) =>
												field.type ===
													'contact_mapped_fields' &&
												getFieldContent(field, key)
										)}
									</div>
								)}
							</CardContent>
						</Card>
					)}

					<Card className="shadow-none rounded-2xl">
						<CardHeader>
							<CardTitle className="text-2xl font-normal text-[#09090B]">
								{__('Contact Profile', 'quillcrm')}
							</CardTitle>
							<div className="text-lg text-[#71717A]">
								{__(
									'Select the list, tags  to assignee contacts and status of that will filled on contacts profile.',
									'quillcrm'
								)}
							</div>
						</CardHeader>

						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								<Field
									label={__('Assign to Lists', 'quillcrm')}
									type="lists"
									value={assignedLists}
									onChange={setAssignedLists}
								/>
								<Field
									label={__('Assign to Tags', 'quillcrm')}
									type="tags"
									value={assignedTags}
									onChange={setAssignedTags}
								/>
							</div>

							<div className="space-y-4">
								{[
									'csv',
									'wpusers',
									'wc_customers_customers',
								].includes(source) && (
									<Field
										label={__('Status', 'quillcrm')}
										type="select"
										value={newStatus}
										onChange={setNewStatus}
										options={statusOptions}
									/>
								)}

								<div className="flex gap-3 items-center">
									<Field
										type="switch"
										value={updateExisting}
										onChange={setUpdateExisting}
										required={false}
									/>
									<div className="text-[#09090B] font-normal text-base">
										{__(
											'Update Existing Contacts',
											'quillcrm'
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<div className="mt-8 flex justify-between">
						<Button
							variant="outline"
							onClick={handleBack}
							disabled={importing}
							className="flex items-center space-x-2 border-[#1E3A8A] bg-[#FAFAFA] text-[#1E3A8A]"
						>
							<ArrowLeft className="w-4 h-4" />
							<span>{__('Back', 'quillcrm')}</span>
						</Button>
						<Button
							onClick={() => importContacts()}
							disabled={importing}
						>
							{importing
								? __('Importing...', 'quillcrm')
								: __('Import Contacts', 'quillcrm')}
							<ArrowRight className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>
		);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				if (!value) {
					resetState();
					onClose();
				}
			}}
		>
			<DialogContent className="z-[1600000] w-screen h-screen max-w-none gap-8 overflow-y-auto py-4 px-16 bg-white rounded-none shadow-none">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-normal text-[#09090B]">
						{__('Import Contacts', 'quillcrm')}
					</h1>
					<div className="text-base text-[#979797] pr-12">
						{source === 'csv'
							? `Step ${currentStep} of 2`
							: 'Step 1 of 1'}
					</div>
				</div>

				<div className="flex h-full gap-5">
					<div className="w-2/5">
						<Card className="p-6 shadow-none rounded-[20px]">
							<CardHeader className="mb-6 p-0">
								<CardTitle className="text-2xl font-normal text-[#09090B]">
									{__('Import From', 'quillcrm')}
								</CardTitle>
								<CardDescription className="text-[#979797] text-base">
									{__(
										'Select Source from where you want to import your contacts',
										'quillcrm'
									)}
								</CardDescription>
							</CardHeader>

							<CardContent className="p-0 space-y-3">
								{sources.map((s) => {
									const isSelected = source === s.value;

									return (
										<Card
											key={s.value}
											onClick={() =>
												!s.disabled &&
												setSource(s.value)
											}
											className={`relative p-4 cursor-pointer transition-all shadow-none border-2 duration-200 
          ${
				isSelected
					? 'border-[#274C77]'
					: s.disabled
						? 'border-[#E2EAF380] bg-gray-50 cursor-not-allowed opacity-50'
						: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
			}`}
										>
											<div className="flex items-center space-x-4">
												<div>{s.icon}</div>

												<div className="flex justify-between items-start w-full">
													<div>
														<h3 className="text-lg text-[#2E2C2F]">
															{s.label}
														</h3>
														<p className="text-sm text-[#979797]">
															{__(
																'Select Source from where you want to import your contacts',
																'quillcrm'
															)}
														</p>
													</div>

													{s.disabled && (
														<Button className="bg-[#3B82F6] rounded-full text-xs px-2 py-1">
															<InstallIcon />
															{__(
																'INSTALL NOW',
																'quillcrm'
															)}
														</Button>
													)}
												</div>
											</div>
										</Card>
									);
								})}
							</CardContent>
						</Card>
					</div>

					<Card className="w-3/5 shadow-none rounded-[20px]">
						<CardHeader className="bg-[#8E9AA80D] rounded-t-[20px]">
							<div className="flex items-center justify-center gap-6">
								<div className="flex items-center gap-3">
									<img
										src={sourceLogos[source]?.src}
										alt={importers[source]?.name || source}
										className={
											sourceLogos[source]?.className
										}
									/>
									{source === 'csv' && (
										<div className="text-[#09090B] text-2xl">
											{' '}
											{__('CSV', 'quillcrm')}
										</div>
									)}
								</div>
								<ChevronRight className="w-6 h-6 text-[#979797]" />
								<div className="text-[#09090B] text-2xl">
									Quill CRM
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-8">
							{renderRightCardContent()}
						</CardContent>
					</Card>
				</div>
			</DialogContent>
		</Dialog>
	);
};

interface ListsMappingProps {
	lists: string[] | null;
	mapping: { list: string; assignedList: number[]; auto: boolean }[];
	onChange: (
		value: { list: string; assignedList: number[]; auto: boolean }[]
	) => void;
}

const ListsMapping: React.FC<ListsMappingProps> = ({
	lists,
	mapping,
	onChange,
}) => {
	if (!lists) {
		return null;
	}

	const getOrAddListToMapped = (list: string) => {
		const index = mapping.findIndex((item) => item.list === list);
		if (index > -1) {
			return { ...mapping[index], index };
		}

		return { list, assignedList: [], auto: false, index: -1 };
	};

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-1/3">
						{__('Source List', 'quillcrm')}
					</TableHead>
					<TableHead className="w-1/3">
						{__('Assign to (QuillCRM)', 'quillcrm')}
					</TableHead>
					<TableHead className="w-1/3">
						{__('Auto Create', 'quillcrm')}
					</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{lists.map((listItem) => {
					const record = { list: listItem };
					const { list, index } = getOrAddListToMapped(record.list);
					const assigned = mapping.find(
						(item) => item.list === record.list
					);

					return (
						<TableRow key={record.list}>
							{/* Source List */}
							<TableCell>{record.list}</TableCell>

							{/* Assign to QuillCRM */}
							<TableCell>
								{assigned?.auto ? (
									<div>
										{__(
											'List will be created automatically',
											'quillcrm'
										)}
									</div>
								) : (
									<Field
										type="lists"
										value={
											getOrAddListToMapped(record.list)
												.assignedList
										}
										onChange={(value) => {
											const { list, index } =
												getOrAddListToMapped(
													record.list
												);
											if (index > -1) {
												mapping[index].assignedList =
													value;
												onChange([...mapping]);
											} else {
												onChange([
													...mapping,
													{
														list,
														assignedList: value,
														auto: false,
													},
												]);
											}
										}}
									/>
								)}
							</TableCell>

							{/* Auto Create */}
							<TableCell>
								<Switch
									checked={assigned?.auto}
									onCheckedChange={(value) => {
										const { list, index } =
											getOrAddListToMapped(record.list);
										if (index > -1) {
											mapping[index].auto = value;
											onChange([...mapping]);
										} else {
											onChange([
												...mapping,
												{
													list,
													assignedList: [],
													auto: value,
												},
											]);
										}
									}}
								/>
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
};

interface TagsMappingProps {
	tags: string[];
	mapping: { tag: string; assignedTag: number[]; auto: boolean }[];
	onChange: (
		value: { tag: string; assignedTag: number[]; auto: boolean }[]
	) => void;
}

const TagsMapping: React.FC<TagsMappingProps> = ({
	tags,
	mapping,
	onChange,
}) => {
	const getOrAddTagToMapped = (tag: string) => {
		const index = mapping.findIndex((item) => item.tag === tag);
		if (index > -1) {
			return { ...mapping[index], index };
		}

		return { tag, assignedTag: [], auto: false, index: -1 };
	};

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-1/3">
						{__('Source Tag', 'quillcrm')}
					</TableHead>
					<TableHead className="w-1/3">
						{__('Assign to (QuillCRM)', 'quillcrm')}
					</TableHead>
					<TableHead className="w-1/3">
						{__('Auto Create', 'quillcrm')}
					</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{tags.map((tagItem) => {
					const record = { tag: tagItem };
					const { tag, index } = getOrAddTagToMapped(record.tag);
					const assigned = mapping.find(
						(item) => item.tag === record.tag
					);

					return (
						<TableRow key={record.tag}>
							{/* Source Tag */}
							<TableCell>{record.tag}</TableCell>

							{/* Assign to QuillCRM */}
							<TableCell>
								{getOrAddTagToMapped(record.tag).auto ? (
									<div>
										{__(
											'Tag will be created automatically',
											'quillcrm'
										)}
									</div>
								) : (
									<Field
										type="tags"
										value={
											getOrAddTagToMapped(record.tag)
												.assignedTag
										}
										onChange={(value) => {
											const { tag, index } =
												getOrAddTagToMapped(record.tag);
											if (index > -1) {
												mapping[index].assignedTag =
													value;
												onChange([...mapping]);
											} else {
												onChange([
													...mapping,
													{
														tag,
														assignedTag: value,
														auto: false,
													},
												]);
											}
										}}
									/>
								)}
							</TableCell>

							{/* Auto Create */}
							<TableCell>
								<Switch
									checked={assigned?.auto}
									onCheckedChange={(value) => {
										const { tag, index } =
											getOrAddTagToMapped(record.tag);
										if (index > -1) {
											mapping[index].auto = value;
											onChange([...mapping]);
										} else {
											onChange([
												...mapping,
												{
													tag,
													assignedTag: [],
													auto: value,
												},
											]);
										}
									}}
								/>
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
};

export default ImportModal;
