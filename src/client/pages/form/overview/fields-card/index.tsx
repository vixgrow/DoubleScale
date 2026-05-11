/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { map, isEmpty } from 'lodash';
import { useNavigate, getToLink } from '@doublescale/navigation';
/**
 * Internal dependencies
 */
import './style.scss';
import { useFormContext } from '../../state/context';
import ConfigAPI from '@doublescale/config';
import type {
	Tag,
	List,
	Form,
	ListsResponse,
	TagsResponse,
} from '@doublescale/client';
import EditHeaderIcon from '@doublescale/shared/icons/edit-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
const FieldsCard: React.FC = () => {
	const { form, isLoading } = useFormContext();
	const { getForms } = ConfigAPI;
	const forms = getForms();
	const fieldsSettings = form
		? forms[form?.form_type]?.fields_settings
		: null;
	const { getAjaxUrl, getNonce, getContactFieldsGroups } = ConfigAPI;
	const contactFieldsGroups = getContactFieldsGroups();
	const [formFields, setFormFields] = useState<
		Form['fields_settings']['fields'] | null
	>(null);
	const [isFetching, setIsFetching] = useState<boolean>(false);
	const [savedTags, setSavedTags] = useState<Tag[]>([]);
	const [savedLists, setSavedLists] = useState<List[]>([]);
	const { createNotice } = useDispatch('doublescale/core');
	const navigate = useNavigate();
	const getFormFields = async () => {
		if (!form || !fieldsSettings) {
			return;
		}

		setIsFetching(true);

		try {
			const body = new FormData();
			body.append('action', fieldsSettings.action);
			body.append('nonce', getNonce());
			map(fieldsSettings.fields, (key) => {
				body.append(key, form[key] || '');
			});
			const response = await fetch(getAjaxUrl(), {
				method: 'POST',
				body,
			});

			const data = await response.json();

			setFormFields(
				data.data.fields as Form['fields_settings']['fields']
			);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch form fields', 'doublescale'),
			});
		} finally {
			setIsFetching(false);
		}
	};

	const fetchLists = async (keyword = '', ids = []) => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/lists', {
					keyword: keyword,
					ids: ids,
				}),
			})) as ListsResponse;

			setSavedLists([...savedLists, ...response.data]);

			return response.data.map((list: List) => ({
				label: list.name,
				value: list.id,
			}));
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch lists', 'doublescale'),
			});
			return [];
		}
	};

	const fetchTags = async (keyword = '', ids = []) => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/tags', {
					keyword: keyword,
					ids: ids,
				}),
			})) as TagsResponse;

			setSavedTags([...savedTags, ...response.data]);

			return response.data.map((tag: Tag) => ({
				label: tag.name,
				value: tag.id,
			}));
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch tags', 'doublescale'),
			});
			return [];
		}
	};

	useEffect(() => {
		getFormFields();

		if (form?.data?.lists) {
			fetchLists('', form.data.lists);
		}

		if (form?.data?.tags) {
			fetchTags('', form.data.tags);
		}
	}, [form?.form_id]);

	const getValueLabel = (value) => {
		for (const groupKey in contactFieldsGroups) {
			const group = contactFieldsGroups[groupKey];
			if (group.fields[value]) {
				return group.fields[value].label;
			}
		}

		return '';
	};

	return (
        <Card style={{ marginTop: 20 }}><CardHeader><CardTitle>{<div className='flex justify-between'>
                        <span>
                            {__('Fields', 'doublescale')}
                        </span>
                        <Button
                            onClick={() => {
                                navigate(getToLink(`forms/${form?.id}/settings`));
                            }}
                            variant='link'
                        >
                            <EditHeaderIcon />
                            {__('Edit', 'doublescale')}
                        </Button>
                    </div>}</CardTitle></CardHeader><CardContent>
                {formFields && (
                    <div className="doublescale-overview-fields-list border border-border rounded-md mb-4">
                        <div className="px-3 py-2 border-b border-border font-medium">
                            {__('Mapped Fields', 'doublescale')}
                        </div>
                        <ul className="divide-y divide-border">
                            <li className="flex justify-between px-3 py-2">
                                <span>{__('Form Fields', 'doublescale')}</span>
                                <span>{__('Contact Fields', 'doublescale')}</span>
                            </li>
                            {map(form?.data.mapped_fields, (value, key) => (
                                <li key={String(key)} className="flex justify-between px-3 py-2">
                                    <span>{formFields[key]}</span>
                                    <span>{getValueLabel(value)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="doublescale-overview-fields-list border border-border rounded-md">
                    <div className="px-3 py-2 border-b border-border font-medium">
                        {__('Contact', 'doublescale')}
                    </div>
                    <ul className="divide-y divide-border">
                        <li className="flex justify-between px-3 py-2">
                            <span>{__('Lists', 'doublescale')}</span>
                            <span className="flex flex-wrap gap-1 justify-end">
                                {isEmpty(savedLists)
                                    ? __('No lists', 'doublescale')
                                    : savedLists.map((list) => (
                                          <Badge key={list.id} variant="secondary">{list.name}</Badge>
                                      ))}
                            </span>
                        </li>
                        <li className="flex justify-between px-3 py-2">
                            <span>{__('Tags', 'doublescale')}</span>
                            <span className="flex flex-wrap gap-1 justify-end">
                                {isEmpty(savedTags)
                                    ? __('No tags', 'doublescale')
                                    : savedTags.map((tag) => (
                                          <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
                                      ))}
                            </span>
                        </li>
                        <li className="flex justify-between px-3 py-2">
                            <span>{__('Update existing contact', 'doublescale')}</span>
                            <span>
                                {form?.data.update_existing_contact
                                    ? __('Yes', 'doublescale')
                                    : __('No', 'doublescale')}
                            </span>
                        </li>
                        <li className="flex justify-between px-3 py-2">
                            <span>{__('Update blank fields', 'doublescale')}</span>
                            <span>
                                {form?.data.update_blank_fields
                                    ? __('Yes', 'doublescale')
                                    : __('No', 'doublescale')}
                            </span>
                        </li>
                        <li className="flex justify-between px-3 py-2">
                            <span>{__('Mark as subscribed', 'doublescale')}</span>
                            <span>
                                {form?.data.mark_as_subscribed
                                    ? __('Yes', 'doublescale')
                                    : __('No', 'doublescale')}
                            </span>
                        </li>
                    </ul>
                </div>
            </CardContent></Card>
    );
};

export default FieldsCard;
