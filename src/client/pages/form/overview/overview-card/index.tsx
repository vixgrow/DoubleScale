/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Card, List as AntList, Typography, Flex, Popover, Button } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import { useFormContext } from '../../state/context';
import ConfigAPI from '@quillcrm/config';
const Overview: React.FC = () => {
	const { form, isLoading, saveForm, navigate } = useFormContext();
	const [deactivating, setDeactivating] = useState(false);
	const formsData = ConfigAPI.getForms();

	const deactivateForm = async () => {
		setDeactivating(true);

		try {
			await saveForm({
				status: 'inactive',
			});

			navigate?.('forms');
		} catch (error) {
			console.error(error);
		} finally {
			setDeactivating(false);
		}
	};

	return (
		<Card
			title={
				<Flex justify="space-between">
					<Typography.Text strong>
						{__('Overview', 'quillcrm')}
					</Typography.Text>
					<Popover
						content={
							<Button
								type="link"
								loading={deactivating}
								onClick={deactivateForm}
							>
								{__('Deactivate', 'quillcrm')}
							</Button>
						}
						trigger="click"
					>
						<MoreOutlined />
					</Popover>
				</Flex>
			}
			loading={isLoading}
		>
			<AntList size="small" className="qcrm-overview-list">
				{form && (
					<>
						<AntList.Item>
							<Flex>
								<Typography.Text strong>
									{__('Name', 'quillcrm')}
								</Typography.Text>
								<Typography.Text>{form.name}</Typography.Text>
							</Flex>
						</AntList.Item>
						<AntList.Item>
							<Flex>
								<Typography.Text strong>
									{__('Form Type', 'quillcrm')}
								</Typography.Text>
								<Typography.Text>
									{formsData[form.form_type]?.label}
								</Typography.Text>
							</Flex>
						</AntList.Item>
						<AntList.Item>
							<Flex>
								<Typography.Text strong>
									{__('Form ID', 'quillcrm')}
								</Typography.Text>
								<Typography.Text>
									{form.form_id}
								</Typography.Text>
							</Flex>
						</AntList.Item>
						<AntList.Item>
							<Flex>
								<Typography.Text strong>
									{__('Status', 'quillcrm')}
								</Typography.Text>
								<Typography.Text>{form.status}</Typography.Text>
							</Flex>
						</AntList.Item>
					</>
				)}
			</AntList>
		</Card>
	);
};

export default Overview;
