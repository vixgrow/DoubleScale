import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Campaigns from './campaigns';
import EmailSequences from '../email-sequences';

const Campaigns_EmailSequences: React.FC = () => {
	const [activeTab, setActiveTab] = useState<string>('campaigns');

	return (
		<div className="h-screen flex flex-col overflow-hidden">
			{/* Tabs Header - Always visible */}
			<div className="flex-shrink-0 bg-white">
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
						<TabsTrigger
							value="campaigns"
							className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
						>
							Campaigns
						</TabsTrigger>
						<TabsTrigger
							value="email-sequences"
							className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3"
						>
							Email Sequences
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Main Content Area */}
			<div className="flex-1 overflow-y-auto">
				{activeTab === 'campaigns' && <Campaigns />}
				{activeTab === 'email-sequences' && <EmailSequences />}
			</div>
		</div>
	);
};

export default Campaigns_EmailSequences;
