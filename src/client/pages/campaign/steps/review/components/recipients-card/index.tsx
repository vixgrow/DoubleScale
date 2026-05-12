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
	const renderChips = (
		items: string[],
		emptyText: string
	) => {
		if (!items.length) {
			return (
				<p className="text-sm font-medium text-muted-foreground">
					{emptyText}
				</p>
			);
		}

		return (
			<div className="flex flex-wrap gap-2">
				{items.map((item, index) => (
					<Badge
						key={`${item}-${index}`}
						className="rounded-md font-normal shadow-none border border-border bg-[#F7F8FA] px-2 py-1 text-sm text-muted-foreground hover:bg-[#F2F4F7]"
					>
						{item}
					</Badge>
				))}
			</div>
		);
	};

	return (
		<CardLayout
			icon={<ContactsIcon />}
			header={__('Recipients', 'doublescale')}
			buttonIcon={<EditIcon />}
			buttonText={__('Edit Recipients', 'doublescale')}
			onButtonClick={onEdit}
		>
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
				<div className="space-y-3 rounded-lg border border-border bg-[#F7F8FA] p-6">
					<h4 className="text-sm font-semibold text-foreground">
						{__('Included Contacts', 'doublescale')}
					</h4>
					<div className="space-y-3">
						<div className="rounded-md border border-border bg-white p-4">
							<p className="mb-2 text-sm font-medium text-foreground">
								{__('Lists', 'doublescale')}
							</p>
							{renderChips(includedLists, __('All Lists', 'doublescale'))}
						</div>
						<div className="rounded-md border border-border bg-white p-4">
							<p className="mb-2 text-sm font-medim text-foreground">
								{__('Tags', 'doublescale')}
							</p>
							{renderChips(
								includedTags,
								__(
									'All Contact on Selected list Segment',
									'doublescale'
								)
							)}
						</div>
					</div>
				</div>

				<div className="space-y-3 rounded-lg border border-border bg-[#F7F8FA] p-6">
					<h4 className="text-sm font-semibold text-foreground">
						{__('Exclude Contacts', 'doublescale')}
					</h4>
					<div className="space-y-3">
						<div className="rounded-md border border-border bg-white p-4">
							<p className="mb-2 text-sm font-medium text-foreground">
								{__('Lists', 'doublescale')}
							</p>
							{renderChips(
								excludedLists,
								__('No lists excluded', 'doublescale')
							)}
						</div>
						<div className="rounded-md border border-border bg-white p-4">
							<p className="mb-2 text-sm font-medium text-foreground">
								{__('Tags', 'doublescale')}
							</p>
							{renderChips(
								excludedTags,
								__('No tags excluded', 'doublescale')
							)}
						</div>
					</div>
				</div>
			</div>
		</CardLayout>
	);
};

export default RecipientsCard;
