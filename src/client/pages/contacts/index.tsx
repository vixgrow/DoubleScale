/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { Modal } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { getToLink, useNavigate } from '@quillcrm/navigation';
import { Field, PlusIcon, PageHeader, ArrowUpIcon, ArrowDownIcon, PageTabs, AllContactsIcon, ListsIcon, TagsIcon, CustomFieldsIcon } from '@quillcrm/components';
import ImportModal from '../import-modal';
import ExportModal from '../export-modal';
import Lists from './lists';
import { ListsRef } from './lists';
import Tags from './tags';
import CustomFields from './custom-fields';
import AllContacts from './all-contacts';
import { Contact } from '@/client/types';
import { createNotice } from '@/stores/core/actions';
import { isEmail } from 'validator';
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';


const ContactsList: React.FC = () => {
	const navigate = useNavigate();
	const [contact, setContact] = useState({
		email: '',
		first_name: '',
		last_name: '',
	});
	const [isSaving, setIsSaving] = useState(false);
	const [importModalVisible, setImportModalVisible] = useState(false);
	const [exportModalVisible, setExportModalVisible] = useState(false);
	const [visible, setVisible] = useState(false);
	const [allContactsKey, setAllContactsKey] = useState(0); // Key to force re-render of AllContacts
	const [activeTab, setActiveTab] = useState('all');

	const listsRef = useRef<ListsRef>(null);

	const tabTitles = {
		all: __('Contacts List', 'quillcrm'),
		lists: __('Lists', 'quillcrm'),
		tags: __('Tags', 'quillcrm'),
		'custom-fields': __('Custom Fields', 'quillcrm'),
	};

	const headerActions =
		activeTab === 'all'
			? [
				{
					label: 'Export Contact',
					onClick: () => setExportModalVisible(true),
					variant: 'outline',
					icon: <ArrowUpIcon />,
				},
				{
					label: 'Import Contact',
					onClick: () => setImportModalVisible(true),
					variant: 'secondary',
					icon: <ArrowDownIcon />,
				},
				{
					label: 'Add Contact',
					onClick: () => setVisible(true),
					icon: <PlusIcon />,
				},
			]
			: activeTab === 'lists'
				? [
					{
						label: 'Add Lists',
						onClick: () => {
							listsRef.current?.openCreateListModal()
						},
						icon: <PlusIcon />,
					},
				]
				: activeTab === 'tags'
					? [
						{
							label: 'Add Tags',
							onClick: () => {
								// your logic for adding a tag
							},
							icon: <PlusIcon />,
						},
					]
					: activeTab === 'custom-fields'
						? [
							{
								label: 'Add Group',
								onClick: () => {
									// your logic for adding a field
								},
								icon: <PlusIcon />,
							},
						]
						: [];

	const createContact = async () => {
		if (!isEmail(contact.email)) {
			createNotice({
				type: 'error',
				message: __('Invalid email', 'quillcrm'),
			});
			return;
		}

		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: '/qc/v1/contacts',
				method: 'POST',
				data: contact,
			})) as Contact;

			navigate(getToLink(`contacts/${response.id}`));
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message || __('Failed to create Contact', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleImportCompleted = () => {
		// Force AllContacts to re-fetch data by changing its key
		setAllContactsKey(prev => prev + 1);
	};

	return (
		<div className="qcrm-contacts-list w-full">
			<PageHeader
				title={tabTitles[activeTab]}
				subtitle={__('Contacts')}
				actions={headerActions}
			/>

			<PageTabs
				defaultValue="all"
				onValueChange={(value) => setActiveTab(value)}
				tabsList={[
					{
						label: 'All Contacts',
						value: 'all',
						icon: <AllContactsIcon />,
					},
					{
						label: 'Lists',
						value: 'lists',
						icon: <ListsIcon />,
					},
					{
						label: 'Tags',
						value: 'tags',
						icon: <TagsIcon />,
					},
					{
						label: 'Custom Fields',
						value: 'custom-fields',
						icon: <CustomFieldsIcon />,
					},
				]}
				tabsContent={[
					{
						value: 'all',
						children: <AllContacts key={allContactsKey} activeTab="all"/>
					},
					{
						value: 'lists',
						children: <Lists ref={listsRef} activeTab="lists"/>,
					},
					{
						value: 'tags',
						children: <Tags />
					},
					{
						value: 'custom-fields',
						children: <CustomFields />,
					},
				]}
			/>

			<Dialog open={visible} onOpenChange={setVisible}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{__('Create Form', 'quillcrm')}</DialogTitle>
					</DialogHeader>

					<div className="qcrm-fields space-y-4">
						<Field
							label={__('Email', 'quillcrm')}
							value={contact.email}
							onChange={(value) =>
								setContact({
									...contact,
									email: value,
								})
							}
							type="email"
						/>
						<Field
							label={__('First Name', 'quillcrm')}
							value={contact.first_name}
							onChange={(value) =>
								setContact({
									...contact,
									first_name: value,
								})
							}
							type="text"
						/>
						<Field
							label={__('Last Name', 'quillcrm')}
							value={contact.last_name}
							onChange={(value) =>
								setContact({
									...contact,
									last_name: value,
								})
							}
							type="text"
						/>
					</div>

					<DialogFooter className="mt-6">
						<Button
							variant="outline"
							onClick={() => setVisible(false)}
						>
							{__('Cancel', 'quillcrm')}
						</Button>
						<Button
							onClick={createContact}
							disabled={isSaving}
						>
							{isSaving ? __('Saving...', 'quillcrm') : __('Create', 'quillcrm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<ImportModal
				open={importModalVisible}
				onClose={() => setImportModalVisible(false)}
				onCompleted={handleImportCompleted}
			/>
			<ExportModal
				open={exportModalVisible}
				onClose={() => setExportModalVisible(false)}
			/>
		</div>
	);
};

export default ContactsList;