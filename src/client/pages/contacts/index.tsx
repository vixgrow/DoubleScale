/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
} from '@quillcrm/components';
import Lists from './lists';
import { ListsRef } from './lists';
import Tags, { TagsRef } from './tags';
import LeadScoring, { LeadScoringRef } from './lead-scoring';
import AllContacts, { AllContactsRef } from './all-contacts';
import { useCapabilities } from '@quillcrm/hooks/use-capabilities';
import { PlusIcon as LeadScoringIcon } from '@quillcrm/components/icons';

const ContactsList: React.FC = () => {
	const [activeTab, setActiveTab] = useState('all');
	const isCrmManager = useCapabilities().isCrmManager();

	const listsRef = useRef<ListsRef>(null);
	const tagsRef = useRef<TagsRef>(null);
	const allContactsRef = useRef<AllContactsRef>(null);
	const leadScoringRef = useRef<LeadScoringRef>(null);
	const tabTitles = {
		all: __('Contacts List', 'quillcrm'),
		lists: __('Lists', 'quillcrm'),
		tags: __('Tags', 'quillcrm'),
		lead_scoring: __('Lead Scoring', 'quillcrm'),
	};

	const headerActions =
		activeTab == 'all'
			? [
					...(isCrmManager
						? [
								{
									label: __('Export Contact', 'quillcrm'),
									onClick: () =>
										allContactsRef.current?.openExportModal(),
									variant: 'outline',
									icon: <ArrowUpIcon />,
								},
								{
									label: __('Import Contact', 'quillcrm'),
									onClick: () =>
										allContactsRef.current?.openImportModal(),
									variant: 'secondary',
									icon: <ArrowDownIcon />,
								},
							]
						: []),
					{
						label: __('Add Contact', 'quillcrm'),
						onClick: () =>
							allContactsRef.current?.openCreateContactModal(),
						icon: <PlusIcon />,
					},
				]
			: activeTab == 'lists' && isCrmManager
				? [
						{
							label: __('Add Lists', 'quillcrm'),
							onClick: () => {
								listsRef.current?.openCreateListModal();
							},
							icon: <PlusIcon />,
						},
					]
				: activeTab == 'tags' && isCrmManager
					? [
							{
								label: __('Add Tags', 'quillcrm'),
								onClick: () => {
									tagsRef.current?.openCreateTagModal();
								},
								icon: <PlusIcon />,
							},
						]
					: activeTab == 'lead_scoring' && isCrmManager
						? [
								{
									label: __('Add', 'quillcrm'),
									onClick: () => {
										leadScoringRef.current?.openCreateModal();
									},
									icon: <PlusIcon />,
								},
							]
						: [];

	return (
		<div className="qcrm-contacts-list w-full">
			<PageHeader
				title={tabTitles[activeTab]}
				subtitle={__('Contacts', 'quillcrm')}
				actions={headerActions}
			/>

			<PageTabs
				defaultValue="all"
				onValueChange={(value) => setActiveTab(value)}
				tabsList={[
					{
						label: __('All Contacts', 'quillcrm'),
						value: 'all',
						icon: <ContactsIcon width={20} height={20} />,
					},
					...(isCrmManager
						? [
								{
									label: __('Lists', 'quillcrm'),
									value: 'lists',
									icon: <ListsIcon width={20} height={20} />,
								},
								{
									label: __('Tags', 'quillcrm'),
									value: 'tags',
									icon: <TagsIcon width={20} height={20} />,
								},
								{
									label: __('Lead Scoring', 'quillcrm'),
									value: 'lead_scoring',
									icon: (
										<LeadScoringIcon
											width={20}
											height={20}
										/>
									),
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
						children: (
							<LeadScoring
								ref={leadScoringRef}
								activeTab="lead_scoring"
							/>
						),
					},
				]}
			/>
		</div>
	);
};

export default ContactsList;
