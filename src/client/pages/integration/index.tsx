/**
 * Internal dependencies
 */
import './style.scss';
import type { Integration as IntegrationType } from '@quillcrm/config';
import Credentials from './credentials';
import App from './app';

interface IntegrationProps {
	open: boolean;
	onClose: () => void;
	integration: IntegrationType;
	slug: string;
}

const Integration: React.FC<IntegrationProps> = ({
	open,
	onClose,
	integration,
	slug,
}) => {
	const { fields } = integration;

	return (
		<>
			{!fields.app && (
				<Credentials
					open={open}
					onClose={onClose}
					integration={integration}
					slug={slug}
				/>
			)}
			{fields.app && (
				<App
					open={open}
					onClose={onClose}
					integration={integration}
					slug={slug}
				/>
			)}
		</>
	);
};

export default Integration;
