/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ActionsGroupRender from './actions-group-render';
import ActionSelectorCard from './action-selector-card';
import './style.scss';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogOverlay,
	DialogDescription,
} from "@/components/ui/dialog";
import ConfigAPI from '@quillcrm/config';
//@ts-ignore
import crm from '../../../../../../../assets/images/crm/crm.png';
//@ts-ignore
import email from '../../../../../../../assets/images/emails/emails.png';
//@ts-ignore
import woocommerce from '../../../../../../../assets/images/woocoomerce/woo-icon.png';
//@ts-ignore
import wpusers from '../../../../../../../assets/images/wordpress/wordpress-icon.png';
//@ts-ignore
import lms from '../../../../../../../assets/images/lms/lms.png';
//@ts-ignore
import data from '../../../../../../../assets/images/send-data/data.png';
//@ts-ignore
import messages from '../../../../../../../assets/images/messages/messages.png';

interface ActionSelectorProps {
	value: string;
	visible: boolean;
	onClose: () => void;
	onChange: (value: string) => void;
	onSave: (actionKey: string) => void;
}

const ActionSelector: React.FC<ActionSelectorProps> = ({
	onChange,
	value,
	onSave,
	visible,
	onClose,
}) => {
	const [isSaving, setIsSaving] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState('crm');
	const automationActions = ConfigAPI.getAutomationActions();

	console.log(automationActions);

	// Filter out delay actions from CRM contact group (handled by Delay Selector)
	const filteredActions = { ...automationActions };
	if (filteredActions.crm?.groups?.contact?.actions) {
		const {
			delay,
			['delay-until-datetime']: delayUntilDatetime,
			...restActions
		} = filteredActions.crm.groups.contact.actions;
		filteredActions.crm = {
			...filteredActions.crm,
			groups: {
				...filteredActions.crm.groups,
				contact: {
					...filteredActions.crm.groups.contact,
					actions: restActions
				}
			}
		};
	}

	const handleActionSelect = async (actionKey: string) => {
		onChange(actionKey);
		setIsSaving(true);
		try {
			await onSave(actionKey);
		} catch (error) {
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	const categoryData = {
		'crm': {
			image: crm,
			description: __('Automate your CRM workflows and tasks', 'quillcrm')
		},
		'lms': {
			image: lms,
			description: __('Trigger actions when forms are submitted', 'quillcrm')
		},
		'woocommerce': {
			image: woocommerce,
			description: __('E-commerce and order automation', 'quillcrm')
		},
		'wp': {
			image: wpusers,
			description: __('WordPress user and content automation', 'quillcrm')
		},
		'send_data': {
			image: data,
			description: __('Send data to external services', 'quillcrm')
		},
		'email': {
			image: email,
			description: __('Send email to users', 'quillcrm')
		},
		'message': {
			image: messages,
			description: __('Send message to users', 'quillcrm')
		}
	};

	const currentCategoryData = filteredActions[selectedCategory];

	return (
		<Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
			<DialogOverlay className="z-[150200]" />
			<DialogContent className="z-[150200] h-[90vh] overflow-y-auto max-w-[1000px]">
				<DialogHeader>
					<DialogTitle>{__('Action Library', 'quillcrm')}</DialogTitle>
					<DialogDescription className='mt-1'>{__('Select an action to add to your workflow', 'quillcrm')}</DialogDescription>
				</DialogHeader>
				<div className="qcrm-fields">
					<div className="qcrm-field">
						<div className="flex h-full gap-5">
							<div className="w-1/2">
								<ActionSelectorCard
									automationActions={filteredActions}
									selectedCategory={selectedCategory}
									setSelectedCategory={setSelectedCategory}
									categoryData={categoryData}
								/>
							</div>
							<div className="w-1/2">
								<ActionsGroupRender
									groups={currentCategoryData?.groups || {}}
									onChange={(value) => handleActionSelect(value)}
									value={value}
									isSaving={isSaving}
								/>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ActionSelector;