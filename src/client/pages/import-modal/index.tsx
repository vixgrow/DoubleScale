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
import { Modal, Flex, Select, Button, Typography, Progress } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';

interface Props {
	open: boolean;
	onClose: () => void;
}

const ImportModal: React.FC<Props> = ({ open, onClose }) => {
	const [importing, setImporting] = useState(false);
	const [count, setCount] = useState(0);
	const [source, setSource] = useState('');
	const { createNotice } = useDispatch('quillcrm/core');
	const [offset, setOffset] = useState(0);

	const sources = [
		{ label: __('CSV', 'quillcrm'), value: 'csv' },
		{ label: __('FluentCRM', 'quillcrm'), value: 'fluentcrm' },
	];

	const importContacts = async (currentOffset = 0) => {
		setImporting(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/import-export/import'),
				method: 'POST',
				data: { source, offset: currentOffset },
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
			}
		} catch (error) {
			console.log(error);

			createNotice({
				type: 'error',
				message: __('Failed to import contacts', 'quillcrm'),
			});
			setImporting(false);
		}
	};

	return (
		<Modal
			title={__('Import Contacts', 'quillcrm')}
			open={open}
			onClose={onClose}
			footer={null}
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
				<Flex gap={10} vertical>
					<Button
						onClick={() => importContacts()}
						loading={importing}
						disabled={!source}
					>
						{__('Import')}
					</Button>
					<Progress
						percent={parseInt(((offset / count) * 100).toFixed(2))}
						status={offset >= count ? 'success' : 'active'}
					/>
				</Flex>
			</Flex>
		</Modal>
	);
};

export default ImportModal;
