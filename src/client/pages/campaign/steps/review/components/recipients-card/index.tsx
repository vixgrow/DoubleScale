/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CardLayout from '../card-layout';
import { TeamIcon } from '@quillcrm/components';
import { Badge } from '@/components/ui/badge';
import { EditIcon } from 'lucide-react';

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
			icon={<TeamIcon />}
			header={__('Recipients', 'quillcrm')}
			buttonIcon={<EditIcon />}
			buttonText={__('Edit Recipients', 'quillcrm')}
			onButtonClick={onEdit}
		>
			<div className="space-y-6">
				{/* Included Contacts */}
				<div>
					<h4 className="text-sm font-semibold text-gray-900 mb-3">
						{__('Included Contacts', 'quillcrm')}
					</h4>
					<div className="grid grid-col-2 gap-2">
						<div>
							<p className="text-xs text-gray-500 mb-2">
								{__('Selected List', 'quillcrm')}
							</p>
							{includedLists.length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{includedLists.map((list, index) => (
										<Badge
											key={index}
											variant="secondary"
											className="bg-gray-100 text-gray-700 hover:bg-gray-100"
										>
											{list}
										</Badge>
									))}
								</div>
							) : (
								<p className="text-sm text-gray-500">
									{__('All Lists', 'quillcrm')}
								</p>
							)}
						</div>

						<div>
							<p className="text-xs text-gray-500 mb-2">
								{__('Selected Tag', 'quillcrm')}
							</p>
							{includedTags.length > 0 ? (
								<div>
									{includedTags.map((tag, index) => (
										<div
											key={index}
											className="text-black font-bold"
										>
											{tag}
										</div>
									))}
								</div>
							) : (
								<p className="text-sm text-gray-500">
									{__(
										'All Contact on Selected list Segment',
										'quillcrm'
									)}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Exclude Contacts */}
				{(excludedLists.length > 0 || excludedTags.length > 0) && (
					<div>
						<h4 className="text-sm font-semibold text-gray-900 mb-3">
							{__('Exclude Contacts', 'quillcrm')}
						</h4>
						<div className="space-y-3">
							{excludedLists.length > 0 && (
								<div>
									<p className="text-xs text-gray-500 mb-2">
										{__('Selected List', 'quillcrm')}
									</p>
									<div className="flex flex-wrap gap-2">
										{excludedLists.map((list, index) => (
											<Badge
												key={index}
												variant="secondary"
												className="bg-gray-100 text-gray-700 hover:bg-gray-100"
											>
												{list}
											</Badge>
										))}
									</div>
								</div>
							)}

							{excludedTags.length > 0 && (
								<div>
									<p className="text-xs text-gray-500 mb-2">
										{__('Selected Tag', 'quillcrm')}
									</p>
									<div className="flex flex-wrap gap-2">
										{excludedTags.map((tag, index) => (
											<Badge
												key={index}
												variant="secondary"
												className="bg-gray-100 text-gray-700 hover:bg-gray-100"
											>
												{tag}
											</Badge>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</CardLayout>
	);
};

export default RecipientsCard;
