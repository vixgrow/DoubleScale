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
import {
	Modal,
	Flex,
	Select,
	Button,
	Typography,
	Progress,
	Upload,
	Table,
	Switch,
	Skeleton
} from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { ContactMappedFields, Field } from '@quillcrm/components';
import { useEffect } from 'react';

interface Props {
	open: boolean;
	onClose: () => void;
	onCompleted: () => void;
}

const ImportModal: React.FC<Props> = ({ open, onClose, onCompleted }) => {
	const [importing, setImporting] = useState(false);
	const [count, setCount] = useState(0);
	const [source, setSource] = useState('');
	const { createNotice } = useDispatch('quillcrm/core');
	const [offset, setOffset] = useState(0);
	const [fileData, setFileData] = useState<{
		file_name: string;
		header_columns: string[];
	} | null>(null);
	const [mappedFields, setMappedFields] = useState<{ [key: string]: string }>(
		{}
	);
	const [isFetching, setIsFetching] = useState(false);
	const [listsMapped, setListsMapped] = useState<{ list: string; assignedList: number[], auto: boolean }[]>([]);
	const [tagsMapped, setTagsMapped] = useState<{ tag: string; assignedTag: number[], auto: boolean }[]>([]);
	const [sourceLists, setSourceLists] = useState<string[] | null>(null);
	const [sourceTags, setSourceTags] = useState<string[] | null>(null);
	const [assignedLists, setAssignedLists] = useState<number[]>([]);
	const [assignedTags, setAssignedTags] = useState<number[]>([]);
	const [newStatus, setNewStatus] = useState<string>('unverified');
	const [updateExisting, setUpdateExisting] = useState(false);

	const sources = [
		{ label: __('CSV', 'quillcrm'), value: 'csv' },
		{ label: __('FluentCRM', 'quillcrm'), value: 'fluentcrm' },
		{ label: __('WP FunnelKit', 'quillcrm'), value: 'wpfunnelkit' },
		{ label: __('WordPress Users', 'quillcrm'), value: 'wpusers' },
		{ label: __('Woocommerce Customers', 'quillcrm'), value: 'wc' },
	];

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
					mapping: mappedFields,
					file_name: fileData?.file_name,
					lists_mapping: listsMapped,
					tags_mapping: tagsMapped,
					lists: assignedLists,
					tags: assignedTags,
					status: newStatus,
					update_existing: updateExisting,
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
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to import contacts', 'quillcrm'),
			});
			setImporting(false);
		}
	};

	const resetState = () => {
		setFileData(null);
		setMappedFields({});
		setListsMapped([]);
		setTagsMapped([]);
		setSourceLists(null);
		setSourceTags(null);
		setAssignedLists([]);
		setAssignedTags([]);
		setNewStatus('unverified');
		setUpdateExisting(false);
		setSource('');
	};

	const uploadFile = async ({ file, onSuccess, onError }) => {
		const formData = new FormData();
		formData.append('file', file);

		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/import-export/upload'),
				method: 'POST',
				body: formData,
			})) as { file_name: string; header_columns: string[] };

			onSuccess();
			setFileData(response);
		} catch (error) {
			onError(error);
		}
	};

	const prepareFields = (fields: string[]) => {
		return fields.reduce((acc, field) => {
			acc[field] = { label: field };
			return acc;
		}, {});
	};

	const getSourceData = async () => {
		if (!['fluentcrm', 'wpfunnelkit'].includes(source)) {
			return;
		}

		setIsFetching(true);

		try {
			const response = await apiFetch({
				path: addQueryArgs(`/qc/v1/import-export/${source}`),
			}) as { lists: string[]; tags: string[] };

			const { lists, tags } = response;

			setSourceLists(lists);
			setSourceTags(tags);
		} catch (error) {
			console.log(error);
		} finally {
			setIsFetching(false);
		}
	};

	useEffect(() => {
		getSourceData();
	}, [source]);

	const getOrAddListToMapped = (list: string) => {
		const index = listsMapped.findIndex((item) => item.list === list);
		if (index > -1) {
			return { ...listsMapped[index], index };
		}

		return { list, assignedList: [], auto: false, index: -1 };
	}

	const getOrAddTagToMapped = (tag: string) => {
		const index = tagsMapped.findIndex((item) => item.tag === tag);
		if (index > -1) {
			return { ...tagsMapped[index], index };
		}

		return { tag, assignedTag: [], auto: false, index: -1 };
	}

	return (
		<Modal
			title={__('Import Contacts', 'quillcrm')}
			open={open}
			onCancel={() => {
				resetState();
				onClose();
			}}
			footer={null}
			style={{ minWidth: '800px', minHeight: '500px' }}
		>
			<Flex vertical gap={10}>
				<Typography.Title level={4}>
					{__('Import Contacts', 'quillcrm')}
				</Typography.Title>
				<Flex gap={10}>
					<Typography.Text>{__('Source')}</Typography.Text>
					<Select
						value={source}
						onChange={(value) => {
							setSourceLists(null);
							setSourceTags(null);
							setIsFetching(false);
							setSource(value);
						}}
						options={sources}
						style={{ width: 200 }}
					/>
				</Flex>
				{isFetching && <Skeleton />}
				{sourceLists && !importing && sourceLists.length > 0 && (
					<Flex vertical gap={20}>
						<Typography.Title level={5}>{__('Lists Map', 'quillcrm')}</Typography.Title>
						<Table
							dataSource={sourceLists.map((list) => ({ list }))}
							pagination={false}
							columns={[
								{
									title: __('Source List', 'quillcrm'),
									dataIndex: 'list',
								},
								{
									title: __('Assign to (QuillCRM)', 'quillcrm'),
									render: (record) => (
										<>
											{getOrAddListToMapped(record.list).auto ? (
												<Typography.Text>{__('List will be created automatically', 'quillcrm')}</Typography.Text>
											) : (
												<Field
													type="lists"
													value={getOrAddListToMapped(record.list).assignedList}
													onChange={(value) => {
														const { list, index } = getOrAddListToMapped(record.list);
														if (index > -1) {
															listsMapped[index].assignedList = value;
															setListsMapped([...listsMapped]);
														} else {
															setListsMapped([...listsMapped, { list, assignedList: value, auto: false }]);
														}
													}}
												/>
											)}
										</>
									),
								},
								{
									title: __('Auto Create', 'quillcrm'),
									render: (record) => (
										<Switch
											checked={listsMapped.find((item) => item.list === record.list)?.auto}
											onChange={(value) => {
												const { list, index } = getOrAddListToMapped(record.list);
												if (index > -1) {
													listsMapped[index].auto = value;

													setListsMapped([...listsMapped]);
												} else {
													setListsMapped([...listsMapped, { list, assignedList: [], auto: value }]);
												}
											}}
										/>
									),
								},
							]}
						/>
					</Flex>
				)}
				{sourceTags && !importing && sourceTags.length > 0 && (
					<Flex vertical gap={20}>
						<Typography.Title level={5}>{__('Tags Map', 'quillcrm')}</Typography.Title>
						<Table
							dataSource={sourceTags.map((tag) => ({ tag }))}
							pagination={false}
							columns={[
								{
									title: __('Source Tag', 'quillcrm'),
									dataIndex: 'tag',
								},
								{
									title: __('Assign to (QuillCRM)', 'quillcrm'),
									render: (record) => (
										<>
											{getOrAddTagToMapped(record.tag).auto ? (
												<Typography.Text>{__('Tag will be created automatically', 'quillcrm')}</Typography.Text>
											) : (
												<Field
													type="tags"
													value={getOrAddTagToMapped(record.tag).assignedTag}
													onChange={(value) => {
														const { tag, index } = getOrAddTagToMapped(record.tag);
														if (index > -1) {
															tagsMapped[index].assignedTag = value;
															setTagsMapped([...tagsMapped]);
														} else {
															setTagsMapped([...tagsMapped, { tag, assignedTag: value, auto: false }]);
														}
													}}
												/>
											)}
										</>
									),
								},
								{
									title: __('Auto Create', 'quillcrm'),
									render: (record) => (
										<Switch
											checked={tagsMapped.find((item) => item.tag === record.tag)?.auto}
											onChange={(value) => {
												const { tag, index } = getOrAddTagToMapped(record.tag);
												if (index > -1) {
													tagsMapped[index].auto = value;

													setTagsMapped([...tagsMapped]);
												} else {
													setTagsMapped([...tagsMapped, { tag, assignedTag: [], auto: value }]);
												}
											}}
										/>
									),
								},
							]}
						/>
					</Flex>
				)}
				{source === 'csv' && (
					<>
						{!fileData && (
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
							>
								<Button>{__('Select File')}</Button>
							</Upload>
						)}
						{fileData && (
							<ContactMappedFields
								fields={prepareFields(fileData.header_columns)}
								values={mappedFields}
								onChange={(values) => setMappedFields(values)}
							/>
						)}
					</>
				)}
				{source && !isFetching && !importing && (
					<Flex vertical gap={20} style={{ margin: '30px 0' }}>
						<Typography.Title level={5}>
							{__('Contact Profile', 'quillcrm')}
						</Typography.Title>
						<Flex gap={20}>
							<Field
								label={__('Assign to QuillCRM List', 'quillcrm')}
								type="lists"
								value={assignedLists}
								onChange={(value) => setAssignedLists(value)}
								helperText={__('Select the list to assign the contacts to', 'quillcrm')}
								style={{ flex: 1 }}
							/>
							<Field
								label={__('Assign to QuillCRM Tags', 'quillcrm')}
								type="tags"
								value={assignedTags}
								onChange={(value) => setAssignedTags(value)}
								helperText={__('Select the tags to assign the contacts to', 'quillcrm')}
								style={{ flex: 1 }}
							/>
						</Flex>
						{!['fluentcrm', 'wpfunnelkit'].includes(source) && (
							<Field
								label={__('Status', 'quillcrm')}
								type="select"
								value={newStatus}
								onChange={(value) => setNewStatus(value)}
								options={statusOptions}
							/>
						)}
						<Field
							label={__('Update Existing Contacts', 'quillcrm')}
							type="switch"
							value={updateExisting}
							onChange={(value) => setUpdateExisting(value)}
						/>
					</Flex>
				)}
				{source === 'csv' && !fileData ? null : (
					<Flex gap={10} vertical>
						<Button
							onClick={() => importContacts()}
							loading={importing}
							disabled={!source || isFetching}
						>
							{__('Import')}
						</Button>
						{importing && (
							<Progress
								percent={parseInt(
									((offset / count) * 100).toFixed(2)
								)}
								status={'active'}
							/>
						)}
					</Flex>
				)}
			</Flex>
		</Modal>
	);
};

export default ImportModal;
