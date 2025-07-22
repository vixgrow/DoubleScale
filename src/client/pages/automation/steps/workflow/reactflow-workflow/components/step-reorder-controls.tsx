/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Button, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import { useAutomationContext } from '../../../../state/context';
import { reorderStep, canMoveStep } from '../utils/step-reorder-utils';
import type { AutomationStep } from '@quillcrm/client';

interface StepReorderControlsProps {
	step: AutomationStep;
	className?: string;
}

const StepReorderControls: React.FC<StepReorderControlsProps> = ({
	step,
	className = '',
}) => {
	const { steps, setSteps } = useAutomationContext();
	const { createNotice } = useDispatch('quillcrm/core');
	const [isMoving, setIsMoving] = useState<'up' | 'down' | null>(null);

	const canMoveUp = canMoveStep(steps, step, 'up');
	const canMoveDown = canMoveStep(steps, step, 'down');

	const handleMove = async (direction: 'up' | 'down') => {
		if (isMoving) return;

		setIsMoving(direction);

		try {
			await reorderStep(step, direction, steps, setSteps, createNotice);
		} finally {
			setIsMoving(null);
		}
	};

	// Don't render if step can't be moved in either direction
	if (!canMoveUp && !canMoveDown) {
		return null;
	}

	return (
		<div className={`qcrm-step-reorder-controls ${className}`}>
			<Tooltip title={__('Move step up', 'quillcrm')} placement="top">
				<Button
					type="text"
					size="small"
					icon={<ArrowUpOutlined />}
					disabled={!canMoveUp}
					loading={isMoving === 'up'}
					onClick={(e) => {
						e.stopPropagation();
						handleMove('up');
					}}
					className="qcrm-step-reorder-controls__button qcrm-step-reorder-controls__button--up"
				/>
			</Tooltip>
			<Tooltip title={__('Move step down', 'quillcrm')} placement="top">
				<Button
					type="text"
					size="small"
					icon={<ArrowDownOutlined />}
					disabled={!canMoveDown}
					loading={isMoving === 'down'}
					onClick={(e) => {
						e.stopPropagation();
						handleMove('down');
					}}
					className="qcrm-step-reorder-controls__button qcrm-step-reorder-controls__button--down"
				/>
			</Tooltip>
		</div>
	);
};

export default StepReorderControls;
