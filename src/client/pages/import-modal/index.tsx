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
} from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { ContactMappedFields } from '@quillcrm/components';

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

	const sources = [
		{ label: __('CSV', 'quillcrm'), value: 'csv' },
		{ label: __('FluentCRM', 'quillcrm'), value: 'fluentcrm' },
		{ label: __('WP FunnelKit', 'quillcrm'), value: 'wpfunnelkit' },
		{ label: __('WordPress Users', 'quillcrm'), value: 'wpusers' },
		{ label: __('Woocommerce Customers', 'quillcrm'), value: 'wc' },
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
				setFileData(null);
				setMappedFields({});
				setSource('');
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

	return (
		<Modal
			title={__('Import Contacts', 'quillcrm')}
			open={open}
			onCancel={onClose}
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
						onChange={(value) => setSource(value)}
						options={sources}
						style={{ width: 200 }}
					/>
				</Flex>
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
				{source === 'csv' && !fileData ? null : (
					<Flex gap={10} vertical>
						<Button
							onClick={() => importContacts()}
							loading={importing}
							disabled={!source}
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
