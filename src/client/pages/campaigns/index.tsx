import Campaigns from './campaigns';
import { applyFilters } from '@wordpress/hooks';
import { useNavigate, getToLink } from '@doublescale/navigation';
import { ProFeatureNotice } from '@/components/pro-feature-notice';
import { __ } from '@wordpress/i18n';

const Campaigns_EmailSequences: React.FC<{ path: string }> = ({ path }) => {
	const navigate = useNavigate();

	const handleNavigate = (path: string) => {
		navigate(getToLink(path));
	};

	const isProActive = applyFilters(
		'doublescale_is_pro_active',
		false
	) as boolean;

	const EmailSequences = applyFilters(
		'doublescale_email_sequences_component',
		handleNavigate
	) as React.ComponentType<{ handleNavigate: (path: string) => void }>;

	return (
		<div className="h-screen flex flex-col overflow-hidden">
			{/* Main Content Area */}
			<div className="flex-1 overflow-y-auto">
				{path === 'campaigns' && <Campaigns />}
				{path === 'email-sequences' && (
					<>
						{!isProActive ? (
							<ProFeatureNotice
								featureName={__('Email Sequences', 'doublescale')}
								description={__(
									'Create automated email sequences to nurture your contacts and drive engagement.',
									'doublescale'
								)}
							/>
						) : (
							EmailSequences && (
								<EmailSequences handleNavigate={handleNavigate} />
							)
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default Campaigns_EmailSequences;
