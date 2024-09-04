/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Button, Flex, Popover, Spin } from 'antd';
import {
	TrophyOutlined,
	BranchesOutlined,
	DisconnectOutlined,
	ThunderboltOutlined,
	PlusCircleOutlined,
} from '@ant-design/icons';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../../state/context';
import type { AutomationStep } from '@quillcrm/client';

interface AddStepProps {
	setStep: (step: AutomationStep) => void;
}

const AddStep: React.FC<AddStepProps> = ({ setStep }) => {
	const { automation, addStep } = useAutomationContext();
	const [loading, setLoading] = useState(false);
	const { createNotice } = useDispatch('quillcrm/core');

	if (!automation) {
		return null;
	}

	const saveStep = async (type: string) => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps`,
				method: 'POST',
				data: {
					automation_id: automation.id,
					type,
					status: 'active',
				},
			})) as AutomationStep;

			addStep(response);
			setStep(response);
			createNotice({
				type: 'success',
				message: __('Step added', 'quillcrm'),
			});
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to add step', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const typesOptions = {
		action: {
			label: __('Action', 'quillcrm'),
			icon: <ThunderboltOutlined />,
		},
		condition: {
			label: __('Condition', 'quillcrm'),
			icon: <BranchesOutlined />,
		},
		goal: {
			label: __('Goal', 'quillcrm'),
			icon: <TrophyOutlined />,
		},
		end_automation: {
			label: __('End Automation', 'quillcrm'),
			icon: <DisconnectOutlined />,
		},
	};

	return (
		<Popover
			placement="top"
			trigger="click"
			content={
				<>
					{loading && <Spin />}
					{!loading && (
						<Flex gap={10} wrap>
							{map(typesOptions, (type, key) => (
								<Button
									key={key}
									icon={type.icon}
									onClick={() => saveStep(key)}
								>
									{type.label}
								</Button>
							))}
						</Flex>
					)}
				</>
			}
		>
			<Button
				type="primary"
				icon={<PlusCircleOutlined />}
				style={{
					borderRadius: '50%',
				}}
			/>
		</Popover>
	);
};

export default AddStep;
