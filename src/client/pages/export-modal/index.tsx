/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Progress, Spin } from 'antd';
import { map } from 'lodash';
import { ArrowLeft, ArrowRight } from 'lucide-react';
/**
 * Internal dependencies
 */
import './style.scss';
import { Button } from '@/components/ui/button';
import { Field, Filters } from '@quillcrm/components';
import ConfigAPI from '@quillcrm/config';
import type { Filter as FilterType, ContactsResponse } from '@quillcrm/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardDescription,
} from '@/components/ui/card';

export interface Props {
	open: boolean;
	onClose: () => void;
}

const ExportModal: React.FC<Props> = ({ open, onClose }) => {
	const [selectedFields, setSelectedFields] = useState<string[]>([
		'first_name',
		'last_name',
		'email',
	]);
	const fields = ConfigAPI.getContactFieldsGroups();
	const [offset, setOffset] = useState(0);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(false);
	const [filters, setFilters] = useState<FilterType[]>([]);
	const [isFiltering, setIsFiltering] = useState(false);
	const [totalContact, setTotalContact] = useState(0);
	const { createNotice } = useDispatch('quillcrm/core');

	const handleExport = async (currentOffset = 0, file = '') => {
		if (selectedFields.length === 0 || loading) {
			return;
		}
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/import-export/export'),
				method: 'POST',
				data: {
					fields: selectedFields,
					offset: currentOffset,
					file_id: file,
					filters: filters,
				},
			})) as {
				offset: number;
				file_id: string;
				status: string;
				total: number;
			};

			setTotal(response.total);
			if (response.status === 'in_progress') {
				setOffset(response.offset);
				setTimeout(
					() => handleExport(response.offset, response.file_id),
					1000
				);
			} else {
				downloadFile(response.file_id);
			}
		} catch (error) {
			setLoading(false);
			createNotice({
				type: 'error',
				message: __('Export failed', 'quillcrm'),
			});
		}
	};

	const downloadFile = async (fileId: string) => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/import-export/download', {
					file_id: fileId,
				}),
				method: 'GET',
				parse: false,
			})) as Response;

			const blob = await response.blob();

			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.style.display = 'none';
			const fileName = `quillcrm-contacts-${fileId}.csv`;
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			handleClose();
		} catch (error) {
			console.log(error);

			createNotice({
				type: 'error',
				message: __('Download failed', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		setOffset(0);
		setLoading(false);
		setSelectedFields(['first_name', 'last_name', 'email']);
		setFilters([]);
		setTotalContact(0);
		setTotal(0);
		setIsFiltering(false);
		onClose();
	};

	const fetchContacts = async () => {
		setIsFiltering(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/contacts', {
					per_page: 1,
					page: 1,
					filters: filters,
				}),
				method: 'GET',
				parse: true,
			})) as ContactsResponse;

			setTotalContact(response.total);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch contacts', 'quillcrm'),
			});
		} finally {
			setIsFiltering(false);
		}
	};

	useEffect(() => {
		if (open) {
			fetchContacts();
		}
	}, [open, filters]);

	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				if (!value) {
					handleClose();
				}
			}}
		>
			<DialogContent className="z-[1600000] w-screen h-screen max-w-none gap-8 overflow-y-auto py-4 px-16 bg-white rounded-none shadow-none">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-normal text-[#09090B]">
						{__('Export Contacts', 'quillcrm')}
					</h1>
				</div>

				<div className="flex h-full gap-5">
					<div className="w-full">
						<Card className="shadow-none rounded-2xl border-none bg-[#FAFAFA]">
							<CardContent className="py-4 px-24">
								<Card className="my-5 px-4 shadow-none rounded-2xl">
									<CardHeader className="">
										<CardTitle className="text-2xl font-normal text-[#09090B]">
											{__('Export Contacts', 'quillcrm')}
										</CardTitle>
										<CardDescription className="text-[#979797] text-base">
											{__(
												'Select Columns that you want to be added on the Table.',
												'quillcrm'
											)}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<Card className="shadow-none rounded-2xl border-2 border-dashed">
											<CardContent className="px-20 py-4">
												<div className="flex flex-col gap-[10px]">
													{!loading && (
														<>
															<div className="qcrm-contacts-list__filters flex flex-col gap-3">
																<div className="flex items-center justify-between">
																	<div className="font-bold text-[#09090B] text-3xl">
																		{__(
																			'Select Exporting Filters',
																			'quillcrm'
																		)}
																	</div>
																	<div className="qcrm-contacts-total flex gap-[10px] text-[#09090B] text-xl font-medium">
																		{__(
																			'Total Contacts based on filters',
																			'quillcrm'
																		)}
																		:{' '}
																		{!isFiltering && (
																			<div>
																				{
																					totalContact
																				}
																			</div>
																		)}
																		{isFiltering && (
																			<Spin />
																		)}
																	</div>
																</div>
																<Filters
																	filters={
																		filters
																	}
																	onChange={(
																		newFilters
																	) => {
																		setFilters(
																			newFilters
																		);
																	}}
																/>
															</div>
															<div className="font-bold text-[#09090B] text-3xl">
																{__(
																	'Select Exporting Fields',
																	'quillcrm'
																)}
															</div>
															<div className="rounded-2xl">
																<div
																	style={{
																		marginTop:
																			'5px',
																		border: '1px solid transparent',
																		borderRadius:
																			'10px',
																		padding:
																			'20px',
																		backgroundImage:
																			'linear-gradient(white, white), linear-gradient(90deg, #1e3a8a 61.06%, #3b82f6 100%)',
																		backgroundOrigin:
																			'border-box',
																		backgroundClip:
																			'padding-box, border-box',
																	}}
																>
																	{!isFiltering &&
																		totalContact >
																			0 && (
																			<>
																				{map(
																					fields,
																					(
																						fieldGroup,
																						index
																					) => (
																						<div
																							className="flex flex-col gap-[16px] mt-3"
																							key={
																								index
																							}
																						>
																							<div className="text-[#09090B] text-xl font-medium">
																								{
																									fieldGroup.label
																								}
																							</div>
																							<div className="flex flex-wrap gap-5">
																								{map(
																									fieldGroup.fields,
																									(
																										field,
																										index
																									) => (
																										<Field
																											key={
																												index
																											}
																											label={
																												field.label
																											}
																											type="checkbox"
																											value={selectedFields.includes(
																												index
																											)}
																											onChange={(
																												value
																											) => {
																												if (
																													value
																												) {
																													setSelectedFields(
																														[
																															...selectedFields,
																															index,
																														]
																													);
																												} else {
																													setSelectedFields(
																														selectedFields.filter(
																															(
																																selectedField
																															) =>
																																selectedField !==
																																index
																														)
																													);
																												}
																											}}
																										/>
																									)
																								)}
																							</div>
																						</div>
																					)
																				)}
																				<div className="flex flex-col gap-[16px] mt-3">
																					<div className="text-[#09090B] text-xl font-medium">
																						{__(
																							'Segments',
																							'quillcrm'
																						)}
																					</div>
																					<div className="flex flex-wrap gap-5">
																						<Field
																							label={__(
																								'Lists',
																								'quillcrm'
																							)}
																							type="checkbox"
																							value={selectedFields.includes(
																								'lists'
																							)}
																							onChange={(
																								value
																							) => {
																								if (
																									value
																								) {
																									setSelectedFields(
																										[
																											...selectedFields,
																											'lists',
																										]
																									);
																								} else {
																									setSelectedFields(
																										selectedFields.filter(
																											(
																												selectedField
																											) =>
																												selectedField !==
																												'lists'
																										)
																									);
																								}
																							}}
																						/>
																						<Field
																							label={__(
																								'Tags',
																								'quillcrm'
																							)}
																							type="checkbox"
																							value={selectedFields.includes(
																								'tags'
																							)}
																							onChange={(
																								value
																							) => {
																								if (
																									value
																								) {
																									setSelectedFields(
																										[
																											...selectedFields,
																											'tags',
																										]
																									);
																								} else {
																									setSelectedFields(
																										selectedFields.filter(
																											(
																												selectedField
																											) =>
																												selectedField !==
																												'tags'
																										)
																									);
																								}
																							}}
																						/>
																					</div>
																				</div>
																				<div className="flex flex-col gap-[16px] mt-3">
																					<div className="text-[#09090B] text-xl font-medium">
																						{__(
																							'Engagement',
																							'quillcrm'
																						)}
																					</div>
																					<div className="flex flex-wrap gap-5">
																						<Field
																							label={__(
																								'Last Email Sent',
																								'quillcrm'
																							)}
																							type="checkbox"
																							value={selectedFields.includes(
																								'last_sent'
																							)}
																							onChange={(
																								value
																							) => {
																								if (
																									value
																								) {
																									setSelectedFields(
																										[
																											...selectedFields,
																											'last_sent',
																										]
																									);
																								} else {
																									setSelectedFields(
																										selectedFields.filter(
																											(
																												selectedField
																											) =>
																												selectedField !==
																												'last_sent'
																										)
																									);
																								}
																							}}
																						/>
																						<Field
																							label={__(
																								'Last Email Opened',
																								'quillcrm'
																							)}
																							type="checkbox"
																							value={selectedFields.includes(
																								'last_opened'
																							)}
																							onChange={(
																								value
																							) => {
																								if (
																									value
																								) {
																									setSelectedFields(
																										[
																											...selectedFields,
																											'last_opened',
																										]
																									);
																								} else {
																									setSelectedFields(
																										selectedFields.filter(
																											(
																												selectedField
																											) =>
																												selectedField !==
																												'last_opened'
																										)
																									);
																								}
																							}}
																						/>
																						<Field
																							label={__(
																								'Last Email Clicked',
																								'quillcrm'
																							)}
																							type="checkbox"
																							value={selectedFields.includes(
																								'last_clicked'
																							)}
																							onChange={(
																								value
																							) => {
																								if (
																									value
																								) {
																									setSelectedFields(
																										[
																											...selectedFields,
																											'last_clicked',
																										]
																									);
																								} else {
																									setSelectedFields(
																										selectedFields.filter(
																											(
																												selectedField
																											) =>
																												selectedField !==
																												'last_clicked'
																										)
																									);
																								}
																							}}
																						/>
																					</div>
																				</div>
																			</>
																		)}
																</div>
															</div>
															{!isFiltering &&
																totalContact ===
																	0 && (
																	<div>
																		{__(
																			'No contacts found based on the filters',
																			'quillcrm'
																		)}
																	</div>
																)}
														</>
													)}
													{loading && (
														<div className="flex flex-col gap-[10px]">
															<div>
																{__(
																	'Exporting...',
																	'quillcrm'
																)}
															</div>
															<Progress
																percent={Math.round(
																	(offset /
																		total) *
																		100
																)}
															/>
														</div>
													)}
												</div>

												<div className="mt-8 flex justify-between items-center">
													<Button
														variant="outline"
														onClick={handleClose}
														disabled={loading}
														className="flex items-center space-x-2 border-[#1E3A8A] bg-[#FAFAFA] text-[#1E3A8A]"
													>
														<ArrowLeft className="w-4 h-4" />
														{__(
															'Cancel',
															'quillcrm'
														)}
													</Button>
													<Button
														onClick={() =>
															handleExport()
														}
														disabled={
															loading ||
															selectedFields.length ===
																0 ||
															isFiltering ||
															totalContact === 0
														}
													>
														{__(
															'Export',
															'quillcrm'
														)}
														<ArrowRight className="w-4 h-4" />
													</Button>
												</div>
											</CardContent>
										</Card>
									</CardContent>
								</Card>
							</CardContent>
						</Card>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ExportModal;
