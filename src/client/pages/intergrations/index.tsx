/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card, Button, Modal, Typography, Flex } from 'antd';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { getToLink, useNavigate, useParams } from '@quillcrm/navigation';
import ConfigAPI from '@quillcrm/config';
import Integration from '../integration';

const Integrations: React.FC = () => {
	const { id, tab } = useParams<{ id: string; tab: string }>();
	const integrations = ConfigAPI.getIntegrations();
	const navigate = useNavigate();

	if (tab && id) {
		const integration = integrations[id];

		if (tab === 'success') {
			Modal.success({
				title: __('Success', 'quillcrm'),
				content: sprintf(
					__('You have successfully connected %s', 'quillcrm'),
					integration.name
				),
				onOk: () => navigate(getToLink('integrations')),
			});
		}
	}

	return (
		<div className="qcrm-integrations">
			<Flex gap={20} wrap="wrap">
				{map(integrations, (integration, key) => (
					<Card key={key} title={integration.name}>
						<Typography.Title
							level={5}
							style={{ marginTop: 0, marginBottom: 20 }}
						>
							{integration.description}
						</Typography.Title>
						<Flex gap={10}>
							<Button
								type="primary"
								onClick={() =>
									navigate(getToLink(`integrations/${key}`))
								}
							>
								{integration.is_connected
									? __('Settings', 'quillcrm')
									: __('Connect', 'quillcrm')}
							</Button>
							{integration.is_connected && (
								<Button>{__('Disconnect', 'quillcrm')}</Button>
							)}
						</Flex>
					</Card>
				))}
			</Flex>
			{id && !tab && (
				<Integration
					integration={integrations[id]}
					slug={id}
					open={!!id}
					onClose={() => navigate(getToLink('integrations'))}
				/>
			)}
		</div>
	);
};

export default Integrations;
