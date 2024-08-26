/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import {
	Card,
	Button,
	Input,
	Flex,
	Switch,
	Typography,
	Tag as AntTag,
} from 'antd';
import { map } from 'lodash';
import AsyncSelect from 'react-select/async';

/**
 * Internal dependencies
 */
import './style.scss';
import { LinkTrigger as LinkTriggerType, Tag, List } from '../types';
import { useParams } from '@quillcrm/navigation';

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

	const fetchLists = async (keyword = '', ids: number[] = []) => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/lists', {
					keyword: keyword,
					ids: ids,
				}),
			})) as any;

			setSavedLists([...savedLists, ...response.data]);

			return response.data.map((list: List) => ({
				label: list.name,
				value: list.id,
			}));
		} catch (error) {
			console.error(error);
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
			})) as any;

			setSavedTags([...savedTags, ...response.data]);

			return response.data.map((tag: Tag) => ({
				label: tag.name,
				value: tag.id,
			}));
		} catch (error) {
			console.error(error);
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
			})) as any;

			setLinkTrigger(response);
			console.log(response);

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
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const saveLink = async (data: any = {}) => {
		setIsSaving(true);

		const newLink = { ...link, ...data };

		try {
			const response = (await apiFetch({
				path: `/qc/v1/link-triggers/${newLink.id}`,
				method: 'POST',
				data: newLink,
			})) as LinkTriggerType;

			setLinkTrigger(response);
		} catch (error) {
			console.error(error);
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
							<div className="qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Name', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Input
										value={link.name}
										onChange={(e) =>
											setLinkTrigger({
												...link,
												name: e.target.value,
											})
										}
									/>
								</div>
							</div>
							<div className="qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Redirect URL', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Input
										value={settings.redirect_url}
										onChange={(e) =>
											updateSettings({
												redirect_url: e.target.value,
											})
										}
									/>
								</div>
							</div>
							<div className="qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Contact', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Flex vertical={true} gap={10}>
										<Flex justify="space-between" gap={10}>
											<Flex
												vertical={true}
												gap={10}
												style={{ flex: 1 }}
											>
												<Typography.Text>
													{__(
														'Add Lists',
														'quillcrm'
													)}
												</Typography.Text>
												<AsyncSelect
													loadOptions={(
														inputValue,
														callback
													) => {
														fetchLists(
															inputValue
														).then((data) => {
															callback(data);
														});
													}}
													onChange={(value: any) => {
														const newLists =
															settings?.add_lists
																? [
																		...settings.add_lists,
																		value.value,
																	]
																: [value.value];
														updateSettings({
															add_lists: newLists,
														});
													}}
													placeholder={__(
														'Select list',
														'quillcrm'
													)}
												/>
												{settings?.add_lists && (
													<Flex gap={10}>
														{map(
															settings.add_lists,
															(list_id) => (
																<AntTag
																	key={
																		list_id.id
																	}
																	closable
																	onClose={() => {
																		updateSettings(
																			{
																				add_lists:
																					settings.add_lists.filter(
																						(
																							list
																						) =>
																							list !==
																							list_id
																					),
																			}
																		);
																	}}
																>
																	{
																		savedLists.find(
																			(
																				list
																			) =>
																				list.id ===
																				list_id
																		)?.name
																	}
																</AntTag>
															)
														)}
													</Flex>
												)}
											</Flex>
											<Flex
												vertical={true}
												gap={10}
												style={{ flex: 1 }}
											>
												<Typography.Text>
													{__('Add Tags', 'quillcrm')}
												</Typography.Text>
												<AsyncSelect
													loadOptions={(
														inputValue,
														callback
													) => {
														fetchTags(
															inputValue
														).then((data) => {
															callback(data);
														});
													}}
													onChange={(value: any) => {
														const newTags =
															settings?.add_tags
																? [
																		...settings.add_tags,
																		value.value,
																	]
																: [value.value];
														updateSettings({
															add_tags: newTags,
														});
													}}
													placeholder={__(
														'Select tag',
														'quillcrm'
													)}
												/>
												{settings?.add_tags && (
													<Flex gap={10}>
														{map(
															settings.add_tags,
															(tag_id) => (
																<AntTag
																	key={
																		tag_id.id
																	}
																	closable
																	onClose={() => {
																		updateSettings(
																			{
																				add_tags:
																					settings.add_tags.filter(
																						(
																							tag
																						) =>
																							tag !==
																							tag_id
																					),
																			}
																		);
																	}}
																>
																	{
																		savedTags.find(
																			(
																				tag
																			) =>
																				tag.id ===
																				tag_id
																		)?.name
																	}
																</AntTag>
															)
														)}
													</Flex>
												)}
											</Flex>
										</Flex>
										<Flex justify="space-between" gap={10}>
											<Flex
												vertical={true}
												gap={10}
												style={{ flex: 1 }}
											>
												<Typography.Text>
													{__(
														'Remove Lists',
														'quillcrm'
													)}
												</Typography.Text>
												<AsyncSelect
													loadOptions={(
														inputValue,
														callback
													) => {
														fetchLists(
															inputValue
														).then((data) => {
															callback(data);
														});
													}}
													onChange={(value: any) => {
														const newLists =
															settings?.remove_lists
																? [
																		...settings.remove_lists,
																		value.value,
																	]
																: [value.value];
														updateSettings({
															remove_lists:
																newLists,
														});
													}}
													placeholder={__(
														'Select list',
														'quillcrm'
													)}
												/>
												{settings?.remove_lists && (
													<Flex gap={10}>
														{map(
															settings.remove_lists,
															(list_id) => (
																<AntTag
																	key={
																		list_id.id
																	}
																	closable
																	onClose={() => {
																		updateSettings(
																			{
																				remove_lists:
																					settings.remove_lists.filter(
																						(
																							list
																						) =>
																							list !==
																							list_id
																					),
																			}
																		);
																	}}
																>
																	{
																		savedLists.find(
																			(
																				list
																			) =>
																				list.id ===
																				list_id
																		)?.name
																	}
																</AntTag>
															)
														)}
													</Flex>
												)}
											</Flex>
											<Flex
												vertical={true}
												gap={10}
												style={{ flex: 1 }}
											>
												<Typography.Text>
													{__(
														'Remove Tags',
														'quillcrm'
													)}
												</Typography.Text>
												<AsyncSelect
													loadOptions={(
														inputValue,
														callback
													) => {
														fetchTags(
															inputValue
														).then((data) => {
															callback(data);
														});
													}}
													onChange={(value: any) => {
														const newTags =
															settings?.remove_tags
																? [
																		...settings.remove_tags,
																		value.value,
																	]
																: [value.value];
														updateSettings({
															remove_tags:
																newTags,
														});
													}}
													placeholder={__(
														'Select tag',
														'quillcrm'
													)}
												/>
												{settings?.remove_tags && (
													<Flex gap={10}>
														{map(
															settings.remove_tags,
															(tag_id) => (
																<AntTag
																	key={
																		tag_id.id
																	}
																	closable
																	onClose={() => {
																		updateSettings(
																			{
																				remove_tags:
																					settings.remove_tags.filter(
																						(
																							tag
																						) =>
																							tag !==
																							tag_id
																					),
																			}
																		);
																	}}
																>
																	{
																		savedTags.find(
																			(
																				tag
																			) =>
																				tag.id ===
																				tag_id
																		)?.name
																	}
																</AntTag>
															)
														)}
													</Flex>
												)}
											</Flex>
										</Flex>
									</Flex>
								</div>
							</div>
							<div className="qcrm-field">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Auto Login', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Switch
										checked={settings.auto_login}
										onChange={(checked) =>
											updateSettings({
												auto_login: checked,
											})
										}
									/>
								</div>
							</div>
						</div>
					</>
				)}
			</Card>
		</div>
	);
};

export default LinkTrigger;
