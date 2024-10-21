/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Card, Button, Flex, Typography } from 'antd';

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
} from '@quillcrm/client';
import { useParams } from '@quillcrm/navigation';
import { Field } from '@quillcrm/components';

const LinkTrigger: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const [link, setLinkTrigger] = useState<LinkTriggerType | null>(null);
	const [loading, setLoading] = useState(true);
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
		fetchLink();
	}, [id]);

	const fetchLink = async () => {
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
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	const saveLink = async (
		data: { [key: string]: Partial<LinkTriggerType> } = {}
	) => {
		setIsSaving(true);

		const newLink = { ...link, ...data };

		try {
			const response = (await apiFetch({
				path: `/qc/v1/link-triggers/${newLink.id}`,
				method: 'POST',
				data: newLink,
			})) as LinkTriggerType;

			setLinkTrigger(response);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const updateSettings = (data: {
		[key: string]: Partial<LinkTriggerType>;
	}) => {
		if (!link) {
			return;
		}

		const newSettings = { ...link.settings, ...data };

		setLinkTrigger({ ...link, settings: newSettings });
	};

	return (
		<div className="qcrm-link-trigger">
			<Card
				title={link?.name || __('Link Trigger', 'quillcrm')}
				extra={
					<Button
						type="primary"
						onClick={() => saveLink()}
						loading={isSaving}
					>
						{__('Save', 'quillcrm')}
					</Button>
				}
				loading={loading}
			>
				{link && (
					<>
						<div className="qcrm-fields">
							<Field
								label={__('Name', 'quillcrm')}
								value={link.name}
								onChange={(value) =>
									setLinkTrigger({ ...link, name: value })
								}
								type="text"
							/>
							<Field
								label={__('Redirect URL', 'quillcrm')}
								value={settings.redirect_url}
								onChange={(value) =>
									updateSettings({ redirect_url: value })
								}
								type="url"
							/>
							<Flex vertical={true} gap={20}>
								<Typography.Text>
									{__('Contact', 'quillcrm')}
								</Typography.Text>
								<Flex gap={10}>
									<Field
										label={__('Add to List', 'quillcrm')}
										value={settings.add_lists}
										onChange={(value) =>
											updateSettings({ add_lists: value })
										}
										type="lists"
									/>
									<Field
										label={__('Add Tags', 'quillcrm')}
										value={settings.add_tags}
										onChange={(value) =>
											updateSettings({ add_tags: value })
										}
										type="tags"
									/>
								</Flex>
								<Flex gap={10}>
									<Field
										label={__(
											'Remove from List',
											'quillcrm'
										)}
										value={settings.remove_lists}
										onChange={(value) =>
											updateSettings({
												remove_lists: value,
											})
										}
										type="lists"
									/>
									<Field
										label={__('Remove Tags', 'quillcrm')}
										value={settings.remove_tags}
										onChange={(value) =>
											updateSettings({
												remove_tags: value,
											})
										}
										type="tags"
									/>
								</Flex>
							</Flex>
							<Field
								label={__('Auto Login', 'quillcrm')}
								value={settings.auto_login}
								onChange={(value) =>
									updateSettings({ auto_login: value })
								}
								type="switch"
							/>
						</div>
					</>
				)}
			</Card>
		</div>
	);
};

export default LinkTrigger;
