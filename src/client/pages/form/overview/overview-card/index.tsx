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
import { useNavigate, getToLink } from '@doublescale/navigation';
/**
 * Internal dependencies
 */
import './style.scss';
import { useFormContext } from '../../state/context';
import ConfigAPI from '@doublescale/config';
const Overview: React.FC = () => {
	const { form, isLoading, saveForm } = useFormContext();
	const [deactivating, setDeactivating] = useState(false);
	const formsData = ConfigAPI.getForms();
	const navigate = useNavigate();
	const deactivateForm = async () => {
		setDeactivating(true);

		try {
			await saveForm({
				status: 'inactive',
			});

			navigate(getToLink('forms'));
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
						{__('Overview', 'doublescale')}
					</Typography.Text>
					<Popover
						content={
							<Button
								type="link"
								loading={deactivating}
								onClick={deactivateForm}
							>
								{__('Deactivate', 'doublescale')}
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
			<AntList size="small" className="doublescale-overview-list">
				{form && (
					<>
						<AntList.Item>
							<Flex>
								<Typography.Text strong>
									{__('Name', 'doublescale')}
								</Typography.Text>
								<Typography.Text>{form.name}</Typography.Text>
							</Flex>
						</AntList.Item>
						<AntList.Item>
							<Flex>
								<Typography.Text strong>
									{__('Form Type', 'doublescale')}
								</Typography.Text>
								<Typography.Text>
									{formsData[form.form_type]?.label}
								</Typography.Text>
							</Flex>
						</AntList.Item>
						<AntList.Item>
							<Flex>
								<Typography.Text strong>
									{__('Form ID', 'doublescale')}
								</Typography.Text>
								<Typography.Text>
									{form.form_id}
								</Typography.Text>
							</Flex>
						</AntList.Item>
						<AntList.Item>
							<Flex>
								<Typography.Text strong>
									{__('Status', 'doublescale')}
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
