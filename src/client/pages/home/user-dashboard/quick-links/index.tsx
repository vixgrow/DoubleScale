/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { ArrowRight, UserPlus, Mail, Upload, Workflow } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
/**
 * internal dependencies
 */
import { AddDealsIcon, CreateFormsIcon, DashboardContentCard, GradientAddContactIcon, GradientAutomationsIcon, GradientCampaignsIcon } from '@quillcrm/components';
import { Button } from '@/components/ui/button';
import { getToLink } from '@quillcrm/navigation';

export const QuickLinks: React.FC = () => {
	const navigate = useNavigate();

	return (
		<DashboardContentCard
			title={__('Quick Links', 'quillcrm')}
			cardClassName="w-2/5"
			headerContent={__('(Most Used Functions)', 'quillcrm')}
		>
			<div className='border-t'></div>
			<div>
				<Button
					variant="ghost"
					className="w-full justify-start h-auto py-4 px-0 border-b-[1.25px] border-dashed border-[#E1E3EA] rounded-none hover:bg-transparent"
					onClick={() => navigate(getToLink('contacts'))}
				>
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center gap-3">
							<div className="bg-[#4A30CF1F] p-2 rounded-xl">
								<GradientAddContactIcon width={24} height={24} />
							</div>
							<span className="text-[#09090B] text-lg font-medium">
								{__('Add New Contact', 'quillcrm')}
							</span>
						</div>
						<ArrowRight className="size-12 text-primary" />
					</div>
				</Button>

				<Button
					variant="ghost"
					className="w-full justify-start h-auto py-4 px-0 border-b-[1.25px] border-dashed border-[#E1E3EA] rounded-none hover:bg-transparent"
					onClick={() => navigate(getToLink('sales-pipeline'))}
				>
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center gap-3">
							<div className="bg-[#4A30CF1F] p-2 rounded-xl">
								<AddDealsIcon width={24} height={24} />
							</div>
							<span className="text-[#09090B] text-lg font-medium">
								{__('Add New Deals', 'quillcrm')}
							</span>
						</div>
						<ArrowRight className="size-12 text-primary" />
					</div>
				</Button>

				<Button
					variant="ghost"
					className="w-full justify-start h-auto py-4 px-0 border-b-[1.25px] border-dashed border-[#E1E3EA] rounded-none hover:bg-transparent"
					onClick={() => navigate(getToLink('campaigns'))}
				>
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center gap-3">
							<div className="bg-[#4A30CF1F] p-2 rounded-xl">
								<GradientCampaignsIcon width={24} height={24} />
							</div>
							<span className="text-[#09090B] text-lg font-medium">
								{__('Add New Campaign', 'quillcrm')}
							</span>
						</div>
						<ArrowRight className="size-12 text-primary" />
					</div>
				</Button>

				<Button
					variant="ghost"
					className="w-full justify-start h-auto py-4 px-0 border-b-[1.25px] border-dashed border-[#E1E3EA] rounded-none hover:bg-transparent"
					onClick={() => navigate(getToLink('automations'))}
				>
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center gap-3">
							<div className="bg-[#4A30CF1F] p-2 rounded-xl">
								<GradientAutomationsIcon width={24} height={24} />
							</div>
							<span className="text-[#09090B] text-lg font-medium">
								{__('Add New Automation', 'quillcrm')}
							</span>
						</div>
						<ArrowRight className="size-12 text-primary" />
					</div>
				</Button>

				<Button
					variant="ghost"
					className="w-full justify-start h-auto py-4 px-0 rounded-none hover:bg-transparent"
					onClick={() => navigate(getToLink('forms'))}
				>
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center gap-3">
							<div className="bg-[#4A30CF1F] p-2 rounded-xl">
								<CreateFormsIcon width={24} height={24} />
							</div>
							<span className="text-[#09090B] text-lg font-medium">
								{__('Add New Forms', 'quillcrm')}
							</span>
						</div>
						<ArrowRight className="size-12 text-primary" />
					</div>
				</Button>
			</div>
		</DashboardContentCard>
	);
};
