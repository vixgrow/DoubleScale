/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	PlusIcon,
	PageHeader,
	ArrowUpIcon,
	ArrowDownIcon,
	PageTabs,
	ListsIcon,
	TagsIcon,
	ContactsIcon,
	LeadScoringIcon,
} from '@doublescale/components';
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';
import Lists from './lists';
import { ListsRef } from './lists';
import Tags, { TagsRef } from './tags';
import AllContacts, { AllContactsRef } from './all-contacts';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';

// Define the ref interface for lead scoring (used by Pro plugin)
export interface LeadScoringRef {
	openCreateModal: () => void;
}

const ContactsList: React.FC = () => {
	const [activeTab, setActiveTab] = useState('all');
	const isCrmManager = useCapabilities().isCrmManager();

	const listsRef = useRef<ListsRef>(null);
	const tagsRef = useRef<TagsRef>(null);
	const allContactsRef = useRef<AllContactsRef>(null);
	const leadScoringRef = useRef<LeadScoringRef>(null);

	// Get lead scoring content from Pro plugin if available
	const leadScoringContent = applyFilters(
		'doublescale_contacts_lead_scoring_tab',
		null,
		leadScoringRef
	) as {
		content: { value: string; children: React.ReactNode };
		headerAction: { label: string; onClick: () => void; icon: React.ReactNode };
	} | null;

	const tabTitles: Record<string, string> = {
		all: __('Contacts List', 'doublescale'),
		lists: __('Lists', 'doublescale'),
		tags: __('Tags', 'doublescale'),
		lead_scoring: __('Lead Scoring', 'doublescale'),
	};

	const headerActions =
		activeTab == 'all'
			? [
					...(isCrmManager
						? [
								{
									label: __('Export Contact', 'doublescale'),
									onClick: () =>
										allContactsRef.current?.openExportModal(),
									variant: 'outline',
									icon: <ArrowUpIcon />,
								},
								{
									label: __('Import Contact', 'doublescale'),
									onClick: () =>
										allContactsRef.current?.openImportModal(),
									variant: 'secondary',
									icon: <ArrowDownIcon />,
								},
							]
						: []),
					{
						label: __('Add Contact', 'doublescale'),
						onClick: () =>
							allContactsRef.current?.openCreateContactModal(),
						icon: <PlusIcon />,
					},
				]
			: activeTab == 'lists' && isCrmManager
				? [
						{
							label: __('Add Lists', 'doublescale'),
							onClick: () => {
								listsRef.current?.openCreateListModal();
							},
							icon: <PlusIcon />,
						},
					]
				: activeTab == 'tags' && isCrmManager
					? [
							{
								label: __('Add Tags', 'doublescale'),
								onClick: () => {
									tagsRef.current?.openCreateTagModal();
								},
								icon: <PlusIcon />,
							},
						]
					: activeTab == 'lead_scoring' && isCrmManager && leadScoringContent
						? [leadScoringContent.headerAction]
						: [];

	return (
		<div className="qcrm-contacts-list w-full">
			<PageHeader
				title={tabTitles[activeTab]}
				subtitle={__('Contacts', 'doublescale')}
				actions={headerActions}
			/>

			<PageTabs
				defaultValue="all"
				onValueChange={(value) => setActiveTab(value)}
				tabsList={[
					{
						label: __('All Contacts', 'doublescale'),
						value: 'all',
						icon: <ContactsIcon width={20} height={20} />,
					},
					...(isCrmManager
						? [
								{
									label: __('Lists', 'doublescale'),
									value: 'lists',
									icon: <ListsIcon width={20} height={20} />,
								},
								{
									label: __('Tags', 'doublescale'),
									value: 'tags',
									icon: <TagsIcon width={20} height={20} />,
								},
								{
									label: __('Lead Scoring', 'doublescale'),
									value: 'lead_scoring',
									icon: <LeadScoringIcon width={20} height={20} />,
								},
							]
						: []),
				]}
				tabsContent={[
					{
						value: 'all',
						children: (
							<AllContacts ref={allContactsRef} activeTab="all" />
						),
					},
					{
						value: 'lists',
						children: <Lists ref={listsRef} activeTab="lists" />,
					},
					{
						value: 'tags',
						children: <Tags ref={tagsRef} activeTab="tags" />,
					},
					{
						value: 'lead_scoring',
						children: leadScoringContent ? (
							leadScoringContent.content.children
						) : (
							<ProFeatureNotice
								featureName={__('Lead Scoring', 'doublescale')}
								description={__(
									'Score and prioritize your leads based on their engagement and behavior. Create custom scoring rules to identify your most valuable prospects with DoubleScale Pro.',
									'doublescale'
								)}
							/>
						),
					},
				]}
			/>
		</div>
	);
};

export default ContactsList;
