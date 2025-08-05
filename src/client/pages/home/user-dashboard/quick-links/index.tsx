/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { isEmpty } from 'lodash';
import { ArrowRight, User } from 'lucide-react';
/**
 * internal dependencies
 */
import { DashboardContentCard } from '@quillcrm/components';
import { NavLink } from '@quillcrm/navigation';
import { EmptyState } from '../../no-data';

export const QuickLinks: React.FC = () => {
	return (
		<DashboardContentCard
			title={__('Quick Links', 'quillcrm')}
			className="w-1/3"
		>
			<div>
				<NavLink to="contacts">
					<div className="flex justify-between items-center border-b-[1.25px] border-dashed border-[#E1E3EA] pb-4">
						<div className="text-[#7E8299] text-lg font-semibold">
							{__('Create New Contact', 'quillcrm')}
						</div>
						<ArrowRight className="size-6 text-primary" />
					</div>
				</NavLink>
				<NavLink to="campaigns">
					<div className="flex justify-between items-center border-b-[1.25px] border-dashed border-[#E1E3EA] py-4">
						<div className="text-[#7E8299] text-lg font-semibold">
							{__('Create New Campaign', 'quillcrm')}
						</div>
						<ArrowRight className="size-6 text-primary" />
					</div>
				</NavLink>
				<NavLink to="contacts">
					<div className="flex justify-between items-center border-b-[1.25px] border-dashed border-[#E1E3EA] py-4">
						<div className="text-[#7E8299] text-lg font-semibold">
							{__('Import Contact', 'quillcrm')}
						</div>
						<ArrowRight className="size-6 text-primary" />
					</div>
				</NavLink>
				<NavLink to="automations">
					<div className="flex justify-between items-center pt-4">
						<div className="text-[#7E8299] text-lg font-semibold">
							{__('Create New Automation', 'quillcrm')}
						</div>
						<ArrowRight className="size-6 text-primary" />
					</div>
				</NavLink>
			</div>
		</DashboardContentCard>
	);
};
