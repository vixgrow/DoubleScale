/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Typography, Flex, Card, Tag } from 'antd';
import { RocketOutlined, ThunderboltOutlined, BranchesOutlined, TrophyOutlined, DisconnectOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../../state/context';
import { getAction, getGoal, getTrigger } from '@quillcrm/utils';
import type { AutomationContact, AutomationStep, OrganizedStep } from '@quillcrm/client';
import { convertDate } from '@quillcrm/utils';

interface ResultProps {
    contact: AutomationContact | null;
};

const Result: React.FC<ResultProps> = ({ contact }) => {
    const { automation } =
        useAutomationContext();

    if (!contact || !automation) {
        return null;
    }

    const trigger = getTrigger(automation.trigger);
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

    const processSteps = (
        parentId: number,
        steps: AutomationStep[]
    ): AutomationStep[] => {
        const newSteps = steps
            .filter((step) => step.parent_id == parentId)
            .map((step) => ({
                ...step,
                children: processSteps(step.id, steps),
            }));

        newSteps.sort((a, b) => a.order - b.order);
        return newSteps;
    };

    const organizeChildrenByCondition = (children: OrganizedStep[]) => {
        const yesChildren = children.filter(
            (child) => child.condition === 'yes'
        );
        const noChildren = children.filter((child) => child.condition === 'no');

        return { yesChildren, noChildren };
    };

    const steps = contact.processes.map((process) => {
        const step = process.step;
        step['process_status'] = process.status;
        step['process_date'] = process.updated_at;

        return step;
    });

    const statuses = {
        'active': __('Active', 'quillcrm'),
        'completed': __('Completed', 'quillcrm'),
        'failed': __('Failed', 'quillcrm'),
    };

    const organizedSteps = processSteps(0, steps) as OrganizedStep[];

    const getStep = (step: AutomationStep) => {
        switch (step.type) {
            case 'goal':
                return getGoal(step.action);
            case 'action':
                return getAction(step.action);

            default:
                return {
                    label: '',
                    description: '',
                    fields: {},
                };
        }
    };

    const renderStep = (step: OrganizedStep) => {
        const { yesChildren, noChildren } = organizeChildrenByCondition(
            step.children || []
        );

        let label = typesOptions[step.type].label;
        const stepData = getStep(step);
        if (
            step.type !== 'condition' &&
            step.type !== 'end_automation' &&
            step.action
        ) {
            label = stepData.label;
        }

        return (
            <div key={step.id} className="qcrm-automation-workflow__item">
                <Card
                    className="qcrm-automation-workflow__card"
                    hoverable
                    title={(
                        <Flex justify='space-between'>
                            <Flex gap={10}>
                                <Typography.Text>{__('Status', 'quillcrm')}:</Typography.Text>
                                <Tag>{statuses[step['process_status']]}</Tag>
                            </Flex>
                            <Flex gap={10}>
                                <Typography.Text>{__('Execution Time', 'quillcrm')}:</Typography.Text>
                                <Typography.Text type="secondary">{convertDate(step['process_date'], true)}</Typography.Text>
                            </Flex>
                        </Flex>
                    )}
                >
                    <Flex gap={10}>
                        <div className="qcrm-automation-workflow__card-icon">
                            {typesOptions[step.type].icon}
                        </div>
                        <div className="qcrm-automation-workflow__card-title">
                            {label}
                        </div>
                    </Flex>
                </Card>
                {step.type === 'condition' && step.children.length > 0 && (
                    <Flex gap={20} style={{ marginTop: 10 }}>
                        <Card
                            className="qcrm-automation-workflow__condition-yes"
                            style={{ flex: 1 }}
                            title={yesChildren.length > 0 ? __('Yes', 'quillcrm') : __('No', 'quillcrm')}
                        >
                            {yesChildren.length > 0 && (
                                <Flex vertical gap={10}>
                                    {yesChildren.map(renderStep)}
                                </Flex>
                            )}
                            {noChildren.length > 0 && (
                                <Flex vertical gap={10}>
                                    {noChildren.map(renderStep)}
                                </Flex>
                            )}
                        </Card>
                    </Flex>
                )}
            </div>
        );
    };

    return (
        <Card>
            <Flex
                style={{ width: 'auto' }}
                gap={20}
                justify="center"
                align="center"
                vertical={true}
            >
                <Flex
                    className="qcrm-automation-workflow"
                    vertical={true}
                    gap={20}
                    style={{ width: '100%' }}
                >
                    <div className="qcrm-automation-workflow__item">
                        <Card
                            className="qcrm-automation-workflow__card"
                            hoverable
                        >
                            <Flex gap={10}>
                                <div className="qcrm-automation-workflow__card-icon">
                                    <RocketOutlined />
                                </div>
                                <div className="qcrm-automation-workflow__card-title">
                                    {trigger.label}
                                </div>
                            </Flex>
                        </Card>
                    </div>
                    {organizedSteps.map(renderStep)}
                </Flex>
            </Flex>
        </Card>
    );
};

export default Result;