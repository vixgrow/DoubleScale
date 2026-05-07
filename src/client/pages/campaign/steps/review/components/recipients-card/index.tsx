/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CardLayout from '../card-layout';
import { ContactsIcon, EditIcon } from '@doublescale/components';
import { Badge } from '@/components/ui/badge';

interface RecipientsCardProps {
	includedLists: string[];
	includedTags: string[];
	excludedLists: string[];
	excludedTags: string[];
	onEdit?: () => void;
}

const RecipientsCard: React.FC<RecipientsCardProps> = ({
	includedLists,
	includedTags,
	excludedLists,
	excludedTags,
	onEdit,
}) => {
	return (
		<CardLayout
			icon={<ContactsIcon />}
			header={__('Recipients', 'doublescale')}
			buttonIcon={<EditIcon />}
			buttonText={__('Edit Recipients', 'doublescale')}
			onButtonClick={onEdit}
		>
			<div className="space-y-6">
				{/* Included Contacts */}
				<div>
					<h4 className="text-lg font-medium text-[#09090B] mb-3">
						{__('Included Contacts', 'doublescale')}
					</h4>
					<div className="flex gap-4">
						{/* Selected List */}
						<div className="flex-1 border border-dashed border-gray-300 rounded-lg p-4">
							<p className="text-base text-gray-500 mb-2">
								{__('Selected List', 'doublescale')}
							</p>
							{includedLists.length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{includedLists.map((list, index) => (
										<Badge
											key={index}
											className="bg-[#F8F8F8] border border-[#DEE1E6] rounded-lg text-[#09090B] text-base font-medium hover:bg-gray-100"
										>
											{list}
										</Badge>
									))}
								</div>
							) : (
								<p className="text-base font-semibold text-[#09090B]">
									{__('All Lists', 'doublescale')}
								</p>
							)}
						</div>

						{/* Selected Tag */}
						<div className="flex-1 border border-dashed border-gray-300 rounded-lg p-4">
							<p className="text-base text-gray-500 mb-2">
								{__('Selected Tag', 'doublescale')}
							</p>
							{includedTags.length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{includedTags.map((tag, index) => (
										<Badge
											key={index}
											className="bg-[#F8F8F8] border border-[#DEE1E6] rounded-lg text-[#09090B] text-base font-medium hover:bg-gray-100"
										>
											{tag}
										</Badge>
									))}
								</div>
							) : (
								<p className="text-base font-semibold text-[#09090B]">
									{__(
										'All Contact on Selected list Segment',
										'doublescale'
									)}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Separator Line */}
				<div className="border-t border-gray-200"></div>

				{/* Exclude Contacts */}
				<div>
					<h4 className="text-lg font-medium text-[#09090B] mb-3">
						{__('Exclude Contacts', 'doublescale')}
					</h4>
					<div className="flex gap-4">
						{/* Selected List */}
						<div className="flex-1 border border-dashed border-gray-300 rounded-lg p-4">
							<p className="text-base text-gray-500 mb-2">
								{__('Selected List', 'doublescale')}
							</p>
							{excludedLists.length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{excludedLists.map((list, index) => (
										<Badge
											key={index}
											className="bg-[#F8F8F8] border border-[#DEE1E6] rounded-lg text-[#09090B] text-base font-medium hover:bg-gray-100"
										>
											{list}
										</Badge>
									))}
								</div>
							) : (
								<p className="text-base font-semibold text-[#09090B]">
									{__('No lists excluded', 'doublescale')}
								</p>
							)}
						</div>

						{/* Selected Tag */}
						<div className="flex-1 border border-dashed border-gray-300 rounded-lg p-4">
							<p className="text-base text-gray-500 mb-2">
								{__('Selected Tag', 'doublescale')}
							</p>
							{excludedTags.length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{excludedTags.map((tag, index) => (
										<Badge
											key={index}
											className="bg-[#F8F8F8] border border-[#DEE1E6] rounded-lg text-[#09090B] text-base font-medium hover:bg-gray-100"
										>
											{tag}
										</Badge>
									))}
								</div>
							) : (
								<p className="text-base font-semibold text-[#09090B]">
									{__('No tags excluded', 'doublescale')}
								</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</CardLayout>
	);
};

export default RecipientsCard;
