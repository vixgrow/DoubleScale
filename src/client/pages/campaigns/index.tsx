import Campaigns from './campaigns';
import EmailSequences from '@doublescale/email-sequences-page';
import { useNavigate, getToLink } from '@doublescale/navigation';

const Campaigns_EmailSequences: React.FC<{ path: string }> = ({ path }) => {
	const navigate = useNavigate();

	const handleNavigate = (path: string) => {
		navigate(getToLink(path));
	};

	return (
		<div className="h-screen flex flex-col overflow-hidden">
			{/* Main Content Area */}
			<div className="flex-1 overflow-y-auto">
				{path === 'campaigns' && <Campaigns />}
				{path === 'email-sequences' && (
					<EmailSequences navigate={handleNavigate} />
				)}
			</div>
		</div>
	);
};

export default Campaigns_EmailSequences;
