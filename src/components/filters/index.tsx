/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Card, Popover, List } from 'antd';
import {
	PlusCircleOutlined,
	RightOutlined,
	LeftOutlined,
} from '@ant-design/icons';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Filter as FilterType } from '@quillcrm/client';
import { getFilterBySlug } from '@quillcrm/utils';
import ConfigAPI from '@quillcrm/config';
import Filter from '../filter';

interface FilterProps {
	filters: FilterType[];
	onChange: (filters: FilterType[]) => void;
	onApply: () => void;
	isApplying: boolean;
}

const Filters: React.FC<FilterProps> = ({
	filters,
	onChange,
	onApply,
	isApplying,
}) => {
	const [selectedGroup, setSelectedGroup] = useState<string>('');
	const [isModalVisible, setIsModalVisible] = useState(false);
	const filtersGroups = ConfigAPI.getFiltersGroups();

	return (
		<div className="qcrm-filters">
			<Card title={__('Filters', 'quillcrm')}>
				{map(filters, (filter: FilterType, index) => {
					const filterSettings = getFilterBySlug(
						filter.filter,
						filter.group
					);
					return (
						<Filter
							key={index}
							filterSettings={filterSettings}
							filter={filter}
							onChange={(key, value) => {
								const newFilters = [...filters];
								newFilters[index] = {
									...newFilters[index],
									[key]: value,
								};
								onChange(newFilters);
							}}
							onRemove={() => {
								const newFilters = [...filters];
								newFilters.splice(index, 1);
								onChange(newFilters);
							}}
						/>
					);
				})}
				<div className="qcrm-filter-actions">
					<Popover
						className="qcrm-filter-popover"
						title={__('Select Group', 'quillcrm')}
						trigger="click"
						open={isModalVisible}
						onOpenChange={(visible) => setIsModalVisible(visible)}
						content={
							<>
								{!selectedGroup && (
									<List
										className="qcrm-filter-groups"
										itemLayout="horizontal"
										dataSource={map(
											filtersGroups,
											(group, key) => {
												return {
													key,
													group,
												};
											}
										)}
										renderItem={(item: any) => (
											<List.Item
												style={{
													cursor: 'pointer',
													padding: '5px 0',
												}}
											>
												<div
													className="qcrm-filter-item"
													onClick={() =>
														setSelectedGroup(
															item.key
														)
													}
												>
													{item.group.name}
													<RightOutlined />
												</div>
											</List.Item>
										)}
									/>
								)}
								{selectedGroup && (
									<>
										<div
											className="qcrm-filter-back"
											onClick={() => setSelectedGroup('')}
											style={{
												cursor: 'pointer',
												padding: '5px 0',
												borderBottom:
													'1px solid #f0f0f0',
											}}
										>
											<LeftOutlined size={10} />
											{__('Back', 'quillcrm')}
										</div>
										<List
											className="qcrm-filter-groups"
											itemLayout="horizontal"
											dataSource={map(
												filtersGroups[selectedGroup]
													.filters,
												(filter, key) => {
													return {
														key,
														filter,
													};
												}
											)}
											renderItem={(item: any) => (
												<List.Item
													style={{
														cursor: 'pointer',
														padding: '5px 0',
													}}
												>
													<div
														className="qcrm-filter-item"
														onClick={() => {
															const newFilters = [
																...filters,
															];
															newFilters.push({
																group: selectedGroup,
																filter: item.key,
																operator: 'is',
																value: '',
															});
															onChange(
																newFilters
															);
															setIsModalVisible(
																false
															);
														}}
													>
														{item.filter.name}
													</div>
												</List.Item>
											)}
										/>
									</>
								)}
							</>
						}
					>
						<Button
							type="text"
							onClick={() => setIsModalVisible(true)}
							icon={<PlusCircleOutlined />}
						/>
					</Popover>
					<Button
						type="primary"
						onClick={() => onApply()}
						disabled={isApplying}
					>
						{__('Apply Filters', 'quillcrm')}
					</Button>
				</div>
			</Card>
		</div>
	);
};

export default Filters;
