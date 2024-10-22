/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import { Button, Flex, Typography, Tabs, Modal, List } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { filter, map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import type { MergeTags } from '@quillcrm/config';

interface MergeTagsSelectorProps {
    visible: boolean;
    onClose: () => void;
}

const MergeTagsSelector: React.FC<MergeTagsSelectorProps> = ({
    visible,
    onClose,
}) => {
    const { currentTrigger } = useSelect((select) => ({
        currentTrigger: select('quillcrm/core').getCurrentTrigger(),
    }));
    const automationMergeTags = ConfigAPI.getMergeTags();
    const automationMergeTagsWithTrigger = filter(automationMergeTags, (group) => {
        return !group.triggers || group.triggers.includes(currentTrigger);
    });
    const mergeTagsTabs = map(automationMergeTagsWithTrigger, (group, index) => ({
        key: index.toString(),
        label: group.name,
        children: (
            <MergeTagsGroupRender
                mergeTags={group.mergeTags}
            />
        ),
    }));

    return (
        <Modal
            title={__('Merge Tags', 'quillcrm')}
            open={visible}
            onCancel={() => onClose()}
            style={{ minWidth: '800px' }}
            closable={false}
        >
            <div className="qcrm-fields" style={{ marginBottom: '20px' }}>
                <div className="qcrm-field">
                    <div className="qcrm-field-input">
                        <Tabs
                            defaultActiveKey="0"
                            tabPosition="left"
                            items={mergeTagsTabs}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const MergeTagsGroupRender: React.FC<{
    mergeTags: MergeTags;
}> = ({ mergeTags }) => {
    const { createNotice, setMergeTagsVisible } = useDispatch('quillcrm/core');

    return (
        <List>
            {map(mergeTags, (tag, key) => (
                <List.Item
                    key={key}
                >
                    <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                        <Typography.Text>{tag.name}</Typography.Text>
                        <Button
                            icon={<CopyOutlined />}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigator.clipboard.writeText(tag.value);
                                setMergeTagsVisible(false);
                                createNotice({
                                    message: __('Merge tag copied to clipboard', 'quillcrm'),
                                    type: 'info',
                                });
                            }}
                        />
                    </Flex>
                </List.Item>
            ))}
        </List>
    );
};

export default MergeTagsSelector;
