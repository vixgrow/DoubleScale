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
import ConfigAPI from '@quillcrm/config';
import type { ImporterField } from '@quillcrm/config';
import { isEmpty, map, trim } from 'lodash';

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
	const [isFetching, setIsFetching] = useState(false);
	const [sourceData, setSourceData] = useState<{
		[key: string]: ImporterField;
	} | null>(null);
	const [credentials, setCredentials] = useState({});
	const [assignedLists, setAssignedLists] = useState<number[]>([]);
	const [assignedTags, setAssignedTags] = useState<number[]>([]);
	const [newStatus, setNewStatus] = useState<string>('unverified');
	const [updateExisting, setUpdateExisting] = useState(false);
	const importers = ConfigAPI.getImporters();
	const importer = importers[source] || null;
	const [values, setValues] = useState({});

	console.log(importers);


	const sources = map(importers, (importer, slug) => ({
		label: importer.name,
		value: slug,
		disabled: !importer.is_active,
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
				message: error.message || __('Failed to import contacts', 'quillcrm'),
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
			setValues({
				...values,
				file_name: response.file_name,
			});
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
		if (!importer || (importer.is_integration && !validateCredentials()) || (!importer.is_integration && isEmpty(importer.fields))) {
			return;
		}

		if (!importer.is_integration && !isEmpty(importer.fields)) {
			setSourceData(importer.fields);
			return;
		}

		setIsFetching(true);

		try {
			const response = await apiFetch({
				path: addQueryArgs(`/qc/v1/import-export/${source}`, {
					credentials,
				}),
			}) as {
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
				const fields = source === 'csv' && fileData ? prepareFields(fileData.header_columns) : field.options;
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
			<Flex gap={10} vertical>
				<Typography.Text>{field.label}</Typography.Text>
				{fieldContent}
			</Flex>
		);
	};

	const validateCredentials = () => {
		if (!importer) {
			return false;
		}

		if (!importer.is_integration || isEmpty(importer.credentials)) {
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

		if (importer.is_integration && (!validateCredentials() || !sourceData)) {
			return false;
		}

		return true;
	};

	const displayImportButton = () => {
		if (isFetching) {
			return false;
		}

		if (importer.is_integration && (!validateCredentials() || !sourceData)) {
			return false;
		}

		return true;
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
				{!importing && (
					<Flex gap={10}>
						<Typography.Text>{__('Source')}</Typography.Text>
						<Select
							value={source}
							onChange={(value) => {
								setIsFetching(false);
								setValues({});
								setCredentials({});
								setSourceData(null);
								setSource(value);
							}}
							options={sources}
							style={{ width: 200 }}
						/>
					</Flex>
				)}
				{isFetching && <Skeleton />}
				{importer && (
					<>
						{!isEmpty(importer.credentials) && !importing && !isFetching && !sourceData && (
							<Flex vertical gap={10}>
								{map(importer.credentials, (field, key) => (
									<Field
										key={key}
										label={field.label}
										type={field.type}
										value={credentials[key]}
										onChange={(value) => {
											setCredentials({ ...credentials, [key]: value });
										}}
									/>
								))}
								<Button
									onClick={getSourceData}
									disabled={!validateCredentials()}
								>
									{__('Fetch Data', 'quillcrm')}
								</Button>
							</Flex>
						)}
						{!importing && !isFetching && sourceData && (
							<Flex vertical gap={20}>
								{importer && (
									<>
										{map(sourceData, (field, key) => getFieldContent(field, key))}
									</>
								)}
							</Flex>
						)}
						{displayContactProfile() && (
							<>
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
									{['csv', 'wpusers', 'wc'].includes(source) && (
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
							</>
						)}
						{displayImportButton() && (
							<Flex gap={10} vertical>
								<Button
									onClick={() => importContacts()}
									loading={importing}
									disabled={
										!source ||
										isFetching ||
										!importer ||
										(source === 'csv' && !fileData)
									}
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
					</>
				)}
			</Flex>
		</Modal>
	);
};

interface ListsMapping {
	lists: string[] | null;
	mapping: { list: string; assignedList: number[], auto: boolean }[];
	onChange: (value: { list: string; assignedList: number[], auto: boolean }[]) => void;
}

const ListsMapping: React.FC<ListsMapping> = ({ lists, mapping, onChange }) => {
	if (!lists) {
		return null;
	}
	const getOrAddListToMapped = (list: string) => {
		const index = mapping.findIndex((item) => item.list === list);
		if (index > -1) {
			return { ...mapping[index], index };
		}

		return { list, assignedList: [], auto: false, index: -1 };
	}

	return (
		<Table
			dataSource={lists.map((list) => ({ list }))}
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
											mapping[index].assignedList = value;
											onChange([...mapping]);
										} else {
											onChange([...mapping, { list, assignedList: value, auto: false }]);
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
							checked={mapping.find((item) => item.list === record.list)?.auto}
							onChange={(value) => {
								const { list, index } = getOrAddListToMapped(record.list);
								if (index > -1) {
									mapping[index].auto = value;

									onChange([...mapping]);
								} else {
									onChange([...mapping, { list, assignedList: [], auto: value }]);
								}
							}}
						/>
					),
				},
			]}
		/>
	);
};

interface TagsMapping {
	tags: string[];
	mapping: { tag: string; assignedTag: number[], auto: boolean }[];
	onChange: (value: { tag: string; assignedTag: number[], auto: boolean }[]) => void;
}

const TagsMapping: React.FC<TagsMapping> = ({ tags, mapping, onChange }) => {
	const getOrAddTagToMapped = (tag: string) => {
		const index = mapping.findIndex((item) => item.tag === tag);
		if (index > -1) {
			return { ...mapping[index], index };
		}

		return { tag, assignedTag: [], auto: false, index: -1 };
	}

	return (
		<Table
			dataSource={tags.map((tag) => ({ tag }))}
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
											mapping[index].assignedTag = value;
											onChange([...mapping]);
										} else {
											onChange([...mapping, { tag, assignedTag: value, auto: false }]);
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
							checked={mapping.find((item) => item.tag === record.tag)?.auto}
							onChange={(value) => {
								const { tag, index } = getOrAddTagToMapped(record.tag);
								if (index > -1) {
									mapping[index].auto = value;

									onChange([...mapping]);
								} else {
									onChange([...mapping, { tag, assignedTag: [], auto: value }]);
								}
							}}
						/>
					),
				},
			]}
		/>
	);
};

export default ImportModal;
