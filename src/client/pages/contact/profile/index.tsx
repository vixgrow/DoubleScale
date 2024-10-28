/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Skeleton, Typography, Collapse } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { useContactContext } from '../state/context';
import { getCustomFieldById } from '@quillcrm/utils';

const Profile: React.FC = () => {
	const { setContact, updateContact, isLoading, isUpdating, contact } =
		useContactContext();

	if (isLoading || !contact) {
		return <Skeleton active />;
	}

	return (
		<>
			<div className="qcrm-contact-profile">
				<Collapse defaultActiveKey={['1']}>
					<Collapse.Panel
						header={__('Contact Details', 'quillcrm')}
						key="1"
					>
						<div className="qcrm-contact-address qcrm-fields">
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('First Name', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													first_name: value,
												});
											},
										}}
									>
										{contact.first_name || '----'}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Last Name', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													last_name: value,
												});
											},
										}}
									>
										{contact.last_name || '----'}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Email', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													email: value,
												});
											},
										}}
									>
										{contact.email}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Phone', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													phone: value,
												});
											},
										}}
									>
										{contact.phone || '----'}
									</Typography.Text>
								</div>
							</div>
						</div>
					</Collapse.Panel>
				</Collapse>
				<Collapse defaultActiveKey={['1']}>
					<Collapse.Panel header={__('Address', 'quillcrm')} key="1">
						<div className="qcrm-contact-address qcrm-fields">
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Address 1', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													address_1: value,
												});
											},
										}}
									>
										{contact.address_1 || '----'}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Address 2', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													address_2: value,
												});
											},
										}}
									>
										{contact.address_2 || '----'}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('City', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													city: value,
												});
											},
										}}
									>
										{contact.city || '----'}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('State', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													state: value,
												});
											},
										}}
									>
										{contact.state || '----'}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Country', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													country: value,
												});
											},
										}}
									>
										{contact.country || '----'}
									</Typography.Text>
								</div>
							</div>
							<div className="qcrm-field inline">
								<div className="qcrm-field-label">
									<Typography.Text>
										{__('Zip', 'quillcrm')}
									</Typography.Text>
								</div>
								<div className="qcrm-field-input">
									<Typography.Text
										editable={{
											onChange: (value) => {
												setContact({
													...contact,
													zip: value,
												});
											},
										}}
									>
										{contact.zip || '----'}
									</Typography.Text>
								</div>
							</div>
						</div>
					</Collapse.Panel>
				</Collapse>
				<Collapse defaultActiveKey={['1']}>
					<Collapse.Panel header={__('Custom Fields', 'quillcrm')} key="1">
					</Collapse.Panel>
				</Collapse>
			</div>
			<Button
				onClick={() => updateContact()}
				type="primary"
				loading={isUpdating}
				style={{ marginTop: '20px' }}
			>
				{__('Update Contact', 'quillcrm')}
			</Button>
		</>
	);
};

export default Profile;
