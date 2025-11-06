/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { LinkTrigger as LinkTriggerType } from '@quillcrm/client';
import { Field } from '@quillcrm/components';

interface LinkTriggerFormProps {
	link: LinkTriggerType;
	onUpdateLink: (updates: Partial<LinkTriggerType>) => void;
	onUpdateSettings: (settings: { [key: string]: any }) => void;
}

const LinkTriggerForm: React.FC<LinkTriggerFormProps> = ({
	link,
	onUpdateLink,
	onUpdateSettings,
}) => {
	const settings = link?.settings || {
		add_lists: [],
		remove_lists: [],
		add_tags: [],
		remove_tags: [],
		redirect_url: '',
		auto_login: false,
	};

	return (
		<div className="qcrm-fields">
			<div className="flex gap-5">
				<Field
					label={__('Name', 'quillcrm')}
					value={link.name}
					onChange={(value) => onUpdateLink({ name: value })}
					type="text"
					required
				/>
				<Field
					label={__('Redirect URL', 'quillcrm')}
					value={settings.redirect_url}
					onChange={(value) =>
						onUpdateSettings({ redirect_url: value })
					}
					type="url"
				/>
			</div>
			<div className="flex flex-col gap-5 mt-5">
				<div className="text-[#09090B] font-bold text-2xl">
					{__('Contact', 'quillcrm')}
				</div>
				<div className="flex gap-5">
					<Field
						label={__('Add to List', 'quillcrm')}
						value={settings.add_lists}
						onChange={(value) =>
							onUpdateSettings({ add_lists: value })
						}
						type="lists"
						required={false}
					/>
					<Field
						label={__('Add Tags', 'quillcrm')}
						value={settings.add_tags}
						onChange={(value) =>
							onUpdateSettings({ add_tags: value })
						}
						type="tags"
						required={false}
					/>
				</div>
				<div className="flex gap-5">
					<Field
						label={__('Remove from List', 'quillcrm')}
						value={settings.remove_lists}
						onChange={(value) =>
							onUpdateSettings({
								remove_lists: value,
							})
						}
						type="lists"
						required={false}
					/>
					<Field
						label={__('Remove Tags', 'quillcrm')}
						value={settings.remove_tags}
						onChange={(value) =>
							onUpdateSettings({
								remove_tags: value,
							})
						}
						type="tags"
						required={false}
					/>
				</div>
			</div>
			<div className="flex items-end gap-4 w-fit">
				<div className="font-bold w-52 text-[#09090B] text-xl">
					{__('Auto Login', 'quillcrm')}
				</div>
				<Field
					value={settings.auto_login}
					onChange={(value) =>
						onUpdateSettings({ auto_login: value })
					}
					type="switch"
				/>
			</div>
		</div>
	);
};

export default LinkTriggerForm;
