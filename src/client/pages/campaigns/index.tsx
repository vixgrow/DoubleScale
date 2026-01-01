import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock } from 'lucide-react';
import Campaigns from './campaigns';
import { applyFilters } from '@wordpress/hooks';
import { ProAutomationModal } from '@/components/pro-automation-modal';
import { useNavigate, getToLink } from '@quillcrm/navigation';

const Campaigns_EmailSequences: React.FC = () => {
	const [activeTab, setActiveTab] = useState<string>('campaigns');
	const [showProModal, setShowProModal] = useState<boolean>(false);
	const navigate = useNavigate();
	const handleNavigate = (path: string) => {
		navigate(getToLink(path));
	};

	const isProActive = applyFilters(
		'quillcrm_is_pro_active',
		false
	) as boolean;

	const EmailSequences = applyFilters(
		'quillcrm_email_sequences_component',
		handleNavigate
	) as React.ComponentType<{ handleNavigate: (path: string) => void }>;

	const handleTabChange = (value: string) => {
		if (value === 'email-sequences' && !isProActive) {
			setShowProModal(true);
		} else {
			setActiveTab(value);
		}
	};

	return (
		<div className="h-screen flex flex-col overflow-hidden">
			{/* Tabs Header - Always visible */}
			<div className="flex-shrink-0 bg-white">
				<Tabs value={activeTab} onValueChange={handleTabChange}>
					<TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
						<TabsTrigger
							value="campaigns"
							className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
						>
							Campaigns
						</TabsTrigger>
						<TabsTrigger
							value="email-sequences"
							className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3 flex items-center gap-2"
						>
							Email Sequences
							{!isProActive && (
								<Lock className="h-4 w-4 text-gray-500" />
							)}
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Main Content Area */}
			<div className="flex-1 overflow-y-auto">
				{activeTab === 'campaigns' && <Campaigns />}
				{activeTab === 'email-sequences' && EmailSequences && (
					<EmailSequences handleNavigate={handleNavigate} />
				)}
			</div>

			{/* PRO Modal */}
			<ProAutomationModal
				visible={showProModal}
				onClose={() => setShowProModal(false)}
				featureName="Email Sequences"
			/>
		</div>
	);
};

export default Campaigns_EmailSequences;
