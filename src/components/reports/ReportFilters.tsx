import React from 'react';
import {
	Flex,
	Typography,
	Select,
	DatePicker,
	Button,
	Space,
	Card,
} from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { __ } from '@wordpress/i18n';
import {
	ReportFilters as ReportFiltersType,
	FilterOptions,
} from '../../hooks/useReportFilters';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface ReportFiltersProps {
	// Filter state
	filters: ReportFiltersType;
	setFilters: (filters: ReportFiltersType) => void;
	filterOptions: FilterOptions;
	showFilters: boolean;
	setShowFilters: (show: boolean) => void;
	clearFilters: () => void;
	applyFilters: () => void;

	// Configuration for which filters to show
	title?: string;
	showDateRange?: boolean;
	showOwner?: boolean;
	showPipeline?: boolean;
	showStatus?: boolean;
	showContact?: boolean;

	// Optional styling
	style?: React.CSSProperties;
	className?: string;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
	filters,
	setFilters,
	filterOptions,
	showFilters,
	setShowFilters,
	clearFilters,
	applyFilters,
	title = __('Filters', 'quillcrm'),
	showDateRange = true,
	showOwner = true,
	showPipeline = true,
	showStatus = true,
	showContact = true,
	style,
	className,
}) => {
	return (
		<Card style={{ marginBottom: 20, ...style }} className={className}>
			<Flex
				justify="space-between"
				align="center"
				style={{ marginBottom: showFilters ? 16 : 0 }}
			>
				<Typography.Title level={5} style={{ margin: 0 }}>
					{title}
				</Typography.Title>
				<Button
					icon={<FilterOutlined />}
					onClick={() => setShowFilters(!showFilters)}
					type={showFilters ? 'primary' : 'default'}
				>
					{__('Filters', 'quillcrm')}
				</Button>
			</Flex>

			{showFilters && (
				<div
					style={{
						borderTop: '1px solid #f0f0f0',
						paddingTop: 16,
					}}
				>
					<Space wrap size="middle">
						{/* Date Range Filter */}
						{showDateRange && (
							<div>
								<Typography.Text
									strong
									style={{
										display: 'block',
										marginBottom: 4,
									}}
								>
									{__('Date Range', 'quillcrm')}
								</Typography.Text>
								<RangePicker
									value={filters.dateRange}
									onChange={(dates) =>
										setFilters({
											...filters,
											dateRange: dates,
										})
									}
									format="YYYY-MM-DD"
									style={{ width: 240 }}
								/>
							</div>
						)}

						{/* Owner Filter */}
						{showOwner && (
							<div>
								<Typography.Text
									strong
									style={{
										display: 'block',
										marginBottom: 4,
									}}
								>
									{__('Owner', 'quillcrm')}
								</Typography.Text>
								<Select
									value={filters.ownerId}
									onChange={(value) =>
										setFilters({
											...filters,
											ownerId: value,
										})
									}
									placeholder={__('Select Owner', 'quillcrm')}
									allowClear
									style={{ width: 160 }}
								>
									{filterOptions.owners?.map((owner) => (
										<Option key={owner.id} value={owner.id}>
											{owner.display_name}
										</Option>
									))}
								</Select>
							</div>
						)}

						{/* Pipeline Filter */}
						{showPipeline && (
							<div>
								<Typography.Text
									strong
									style={{
										display: 'block',
										marginBottom: 4,
									}}
								>
									{__('Pipeline', 'quillcrm')}
								</Typography.Text>
								<Select
									value={filters.pipelineId}
									onChange={(value) =>
										setFilters({
											...filters,
											pipelineId: value,
										})
									}
									placeholder={__(
										'Select Pipeline',
										'quillcrm'
									)}
									allowClear
									style={{ width: 160 }}
								>
									{filterOptions.pipelines?.map(
										(pipeline) => (
											<Option
												key={pipeline.id}
												value={pipeline.id}
											>
												{pipeline.name}
											</Option>
										)
									)}
								</Select>
							</div>
						)}

						{/* Status Filter */}
						{showStatus && (
							<div>
								<Typography.Text
									strong
									style={{
										display: 'block',
										marginBottom: 4,
									}}
								>
									{__('Status', 'quillcrm')}
								</Typography.Text>
								<Select
									value={filters.status}
									onChange={(value) =>
										setFilters({
											...filters,
											status: value,
										})
									}
									placeholder={__(
										'Select Status',
										'quillcrm'
									)}
									allowClear
									style={{ width: 120 }}
								>
									<Option value="open">
										{__('Open', 'quillcrm')}
									</Option>
									<Option value="won">
										{__('Won', 'quillcrm')}
									</Option>
									<Option value="lost">
										{__('Lost', 'quillcrm')}
									</Option>
								</Select>
							</div>
						)}

						{/* Contact Filter */}
						{showContact && (
							<div>
								<Typography.Text
									strong
									style={{
										display: 'block',
										marginBottom: 4,
									}}
								>
									{__('Contact', 'quillcrm')}
								</Typography.Text>
								<Select
									value={filters.contactId}
									onChange={(value) =>
										setFilters({
											...filters,
											contactId: value,
										})
									}
									placeholder={__(
										'Select Contact',
										'quillcrm'
									)}
									allowClear
									style={{ width: 160 }}
								>
									{filterOptions.contacts?.map((contact) => (
										<Option
											key={contact.id}
											value={contact.id}
										>
											{contact.first_name}{' '}
											{contact.last_name}
										</Option>
									))}
								</Select>
							</div>
						)}

						{/* Action Buttons */}
						<div>
							<Typography.Text
								strong
								style={{
									display: 'block',
									marginBottom: 4,
								}}
							>
								{__('Actions', 'quillcrm')}
							</Typography.Text>
							<Space>
								<Button onClick={clearFilters}>
									{__('Clear', 'quillcrm')}
								</Button>
								<Button type="primary" onClick={applyFilters}>
									{__('Apply', 'quillcrm')}
								</Button>
							</Space>
						</div>
					</Space>
				</div>
			)}
		</Card>
	);
};

export default ReportFilters;
