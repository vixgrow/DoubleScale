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
	AllContactsIcon,
	ListsIcon,
	TagsIcon,
	CustomFieldsIcon,
} from '@quillcrm/components';
import Lists from './lists';
import { ListsRef } from './lists';
import Tags, { TagsRef } from './tags';
import CustomFields from './custom-fields';
import AllContacts, { AllContactsRef } from './all-contacts';

const ContactsList: React.FC = () => {
	const [activeTab, setActiveTab] = useState('all');

	const listsRef = useRef<ListsRef>(null);
	const tagsRef = useRef<TagsRef>(null);
	const allContactsRef = useRef<AllContactsRef>(null);

	const tabTitles = {
		all: __('Contacts List', 'quillcrm'),
		lists: __('Lists', 'quillcrm'),
		tags: __('Tags', 'quillcrm'),
		'custom-fields': __('Custom Fields', 'quillcrm'),
	};

	const headerActions =
		activeTab == 'all'
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
					{
						label: __('Add Contact', 'quillcrm'),
						onClick: () =>
							allContactsRef.current?.openCreateContactModal(),
						icon: <PlusIcon />,
					},
				]
			: activeTab == 'lists'
				? [
						{
							label: __('Add Lists', 'quillcrm'),
							onClick: () => {
								listsRef.current?.openCreateListModal();
							},
							icon: <PlusIcon />,
						},
					]
				: activeTab == 'tags'
					? [
							{
								label: __('Add Tags', 'quillcrm'),
								onClick: () => {
									tagsRef.current?.openCreateTagModal();
								},
								icon: <PlusIcon />,
							},
						]
					: activeTab === 'custom-fields'
						? [
								{
									label: __('Add Group', 'quillcrm'),
									onClick: () => {
										// your logic for adding a field
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
						icon: <AllContactsIcon />,
					},
					{
						label: __('Lists', 'quillcrm'),
						value: 'lists',
						icon: <ListsIcon />,
					},
					{
						label: __('Tags', 'quillcrm'),
						value: 'tags',
						icon: <TagsIcon />,
					},
					{
						label: __('Custom Fields', 'quillcrm'),
						value: 'custom-fields',
						icon: <CustomFieldsIcon />,
					},
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
						value: 'custom-fields',
						children: <CustomFields />,
					},
				]}
			/>
		</div>
	);
};

export default ContactsList;
