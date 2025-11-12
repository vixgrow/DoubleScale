/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { useRef } from 'react';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	LinkTrigger as LinkTriggerType,
	Tag,
	List,
	TagsResponse,
	ListsResponse,
	NoticeMessage,
} from '@quillcrm/client';
import { useParams, useNavigate, getToLink } from '@quillcrm/navigation';
import {
	NoticeBanner,
	PanelLayout,
	PanelSettings,
	CreateFormsIcon,
	PlayIcon,
} from '@quillcrm/components';
import { Button } from '@quillcrm/components/ui/button';
import { isEmpty } from 'validator';
import LinkTriggerForm from './link-trigger-form';

interface LinkTriggerProps {
	isNewLinkTrigger?: boolean;
	onClose?: () => void;
	onSuccess?: (message: string) => void;
}

const LinkTrigger: React.FC<LinkTriggerProps> = ({
	isNewLinkTrigger = false,
	onClose,
	onSuccess,
}) => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [link, setLinkTrigger] = useState<LinkTriggerType | null>(null);
	const [loading, setLoading] = useState(!isNewLinkTrigger);
	const [isSaving, setIsSaving] = useState(false);
	const [savedTags, setSavedTags] = useState<Tag[]>([]);
	const [savedLists, setSavedLists] = useState<List[]>([]);
	const settings = link?.settings || {
		add_lists: [],
		remove_lists: [],
		add_tags: [],
		remove_tags: [],
		redirect_url: '',
		auto_login: false,
	};
	const { createNotice } = useDispatch('quillcrm/core');

	// Notice state
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);

	// Helper function to show notice
	const showNotice = (type: 'success' | 'error', message: string) => {
		setNotice({ type, message });
	};

	// Helper function to close notice
	const closeNotice = () => {
		setNotice(null);
	};

	// Scroll to notice banner when notice appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}, [notice]);

	const fetchLists = async (keyword = '', ids: number[] = []) => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/lists', {
					keyword: keyword,
					ids: ids,
				}),
			})) as ListsResponse;

			setSavedLists([...savedLists, ...response.data]);

			return response.data.map((list: List) => ({
				label: list.name,
				value: list.id,
			}));
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
			return [];
		}
	};

	const fetchTags = async (keyword = '', ids: number[] = []) => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/tags', {
					keyword: keyword,
					ids: ids,
				}),
			})) as TagsResponse;

			setSavedTags([...savedTags, ...response.data]);

			return response.data.map((tag: Tag) => ({
				label: tag.name,
				value: tag.id,
			}));
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
			return [];
		}
	};

	useEffect(() => {
		if (isNewLinkTrigger) {
			// Initialize with empty link trigger for new creation
			setLinkTrigger({
				id: 0,
				name: '',
				hash: '',
				status: 'inactive',
				click_count: '0',
				created_at: '',
				updated_at: '',
				full_url: '',
				settings: {
					add_lists: [],
					remove_lists: [],
					add_tags: [],
					remove_tags: [],
					redirect_url: '',
					auto_login: false,
				},
			} as LinkTriggerType);
			setLoading(false);
		} else if (id) {
			fetchLink();
		}
	}, [id, isNewLinkTrigger]);

	const fetchLink = async () => {
		if (!id) return;

		setLoading(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/link-triggers/${id}`,
			})) as LinkTriggerType;

			setLinkTrigger(response);

			if (response) {
				if (
					response.settings?.add_lists ||
					response.settings?.remove_lists
				) {
					const listIds = [
						...response.settings.add_lists,
						...response.settings.remove_lists,
					];

					fetchLists('', listIds);
				}

				if (
					response.settings?.add_tags ||
					response.settings?.remove_tags
				) {
					const tagIds = [
						...response.settings.add_tags,
						...response.settings.remove_tags,
					];

					fetchTags('', tagIds);
				}
			}
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setLoading(false);
		}
	};

	const saveLink = async (data: Partial<LinkTriggerType> = {}) => {
		if (!link) return;

		if (isEmpty(link.name, { ignore_whitespace: true })) {
			showNotice(
				'error',
				__('Link trigger name is required', 'quillcrm')
			);
			return;
		}

		setIsSaving(true);
		const newLink = { ...link, ...data };

		try {
			let response: LinkTriggerType;

			if (isNewLinkTrigger && (!newLink.id || newLink.id === 0)) {
				// Create new link trigger
				response = (await apiFetch({
					path: '/qc/v1/link-triggers',
					method: 'POST',
					data: newLink,
				})) as LinkTriggerType;
			} else {
				// Update existing link trigger
				response = (await apiFetch({
					path: `/qc/v1/link-triggers/${newLink.id}`,
					method: 'POST',
					data: newLink,
				})) as LinkTriggerType;
			}

			setLinkTrigger(response);

			// Handle post-save actions first
			if (isNewLinkTrigger) {
				onClose?.();
				if (!onClose) {
					navigate(getToLink(`link-triggers/${response.id}`));
				}
			} else {
				// For update operations, close modal immediately
				onClose?.();
			}

			// Show success message and call success callback
			const successMessage = isNewLinkTrigger
				? __('Link trigger created successfully', 'quillcrm')
				: __('Link trigger updated successfully', 'quillcrm');

			onSuccess?.(successMessage);
			showNotice('success', successMessage);

			return response;
		} catch (error: any) {
			showNotice('error', error.message);
			throw error;
		} finally {
			setIsSaving(false);
		}
	};

	const updateSettings = (data: { [key: string]: any }) => {
		if (!link) {
			return;
		}

		const newSettings = { ...link.settings, ...data };
		setLinkTrigger({ ...link, settings: newSettings });
	};

	const handleUpdateLink = (updates: Partial<LinkTriggerType>) => {
		if (!link) return;
		setLinkTrigger({ ...link, ...updates });
	};

	const handleSave = async () => {
		try {
			await saveLink();
		} catch (error: any) {
			showNotice('error', error.message);
		}
	};

	const handleCancel = () => {
		if (isNewLinkTrigger && onClose) {
			onClose();
		} else {
			navigate(getToLink('link-triggers'));
		}
	};

	const breadcrumbItems = isNewLinkTrigger
		? [
				{
					label: __('Create Link', 'quillcrm'),
				},
				{
					label: __('Link Triggers List', 'quillcrm'),
					href: 'link-triggers',
				},
				{
					label: __('Link Trigger Information', 'quillcrm'),
				},
			]
		: [
				{
					label: __('Edit Link', 'quillcrm'),
				},
				{
					label: __('Link Triggers List', 'quillcrm'),
					href: 'link-triggers',
				},
				{
					label: __('Link Trigger Information', 'quillcrm'),
				},
			];

	return (
		<PanelLayout
			items={breadcrumbItems}
			panelbtns={[
				<Button key="tutorial" variant="secondaryDeepBlue">
					<PlayIcon />
					{__('Watch Tutorial', 'quillcrm')}
				</Button>,
			]}
			totalSteps={1}
			currentStep={0}
			onNext={handleSave}
			onBack={handleCancel}
			nextLabel={
				isNewLinkTrigger
					? __('Submit Link', 'quillcrm')
					: __('Update Link', 'quillcrm')
			}
			backLabel={__('Cancel', 'quillcrm')}
			showSaveDraft={false}
			isLoading={isSaving}
		>
			{notice && (
				<NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />
			)}
			<div className="flex gap-6">
				<PanelSettings
					title={__('Link Trigger Information', 'quillcrm')}
					description={__(
						'Add The Following data below to continue creating new Link Trigger.',
						'quillcrm'
					)}
					icon={<CreateFormsIcon />}
					iconVariant={'white'}
					className="w-full"
				>
					{link && (
						<LinkTriggerForm
							link={link}
							onUpdateLink={handleUpdateLink}
							onUpdateSettings={updateSettings}
						/>
					)}
				</PanelSettings>
			</div>
		</PanelLayout>
	);
};

export default LinkTrigger;
